'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn, getTodayDateString } from '@/lib/utils';

interface DateNavigationBarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const subscribeToHydration = () => () => {};
const getIsMountedSnapshot = () => true;
const getIsMountedServerSnapshot = () => false;

// Parse string YYYY-MM-DD secara aman tanpa terpengaruh timezone offset
const parseSafeDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function DateNavigationBar({
  selectedDate,
  onSelectDate,
}: DateNavigationBarProps) {
  const isMounted = useSyncExternalStore(
    subscribeToHydration,
    getIsMountedSnapshot,
    getIsMountedServerSnapshot
  );
  const selectedBtnRef = useRef<HTMLButtonElement | null>(null);

  // Scroll tombol tanggal terpilih ke tengah carousel (hanya di client)
  useEffect(() => {
    if (!isMounted) return;
    selectedBtnRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedDate, isMounted]);

  // Skeleton statis: identik di server dan client saat render pertama
  // (JANGAN tampilkan tanggal di sini, karena nilainya bisa berbeda)
  if (!isMounted) {
    return (
      <div className="w-full border-b border-slate-200/85 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#007AFF]" />
            <span className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // Dari sini hanya berjalan di client setelah mount
  const todayStr = getTodayDateString();
  const effectiveDate = selectedDate || todayStr;

  const today = parseSafeDate(todayStr);
  const selected = parseSafeDate(effectiveDate);

  // Generate 7 hari berturut-turut mulai dari hari ini
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const handlePrevDay = () => {
    onSelectDate(format(addDays(selected, -1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    onSelectDate(format(addDays(selected, 1), 'yyyy-MM-dd'));
  };

  const isSelectedToday = isSameDay(selected, today);

  return (
    <div className="w-full border-b border-slate-200/85 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Judul tanggal & tombol navigasi */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="rounded-lg border border-slate-200/80 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
            title="Hari Sebelumnya"
            aria-label="Hari Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#007AFF]" />
            <span className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
              {format(selected, 'EEEE, d MMMM yyyy', { locale: id })}
            </span>
            {isSelectedToday && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                Hari Ini
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="rounded-lg border border-slate-200/80 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
            title="Hari Berikutnya"
            aria-label="Hari Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Carousel 7 hari */}
        <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 md:w-auto no-scrollbar">
          {next7Days.map((dateItem) => {
            const dateStr = format(dateItem, 'yyyy-MM-dd');
            const isSelected = effectiveDate === dateStr;
            const isToday = isSameDay(dateItem, today);

            return (
              <button
                type="button"
                key={dateStr}
                ref={isSelected ? selectedBtnRef : null}
                onClick={() => onSelectDate(dateStr)}
                aria-pressed={isSelected}
                className={cn(
                  'flex min-w-[72px] flex-col items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150 sm:min-w-[82px]',
                  isSelected
                    ? 'bg-[#007AFF] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] uppercase font-medium',
                    isSelected ? 'text-blue-100' : 'text-slate-500'
                  )}
                >
                  {isToday ? 'Hari Ini' : format(dateItem, 'EEE', { locale: id })}
                </span>
                <span className="text-sm font-bold mt-0.5">
                  {format(dateItem, 'd MMM', { locale: id })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset & date picker native */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {!isSelectedToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Hari Ini
            </button>
          )}

          <div className="relative flex items-center">
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}