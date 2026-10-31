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
      <div className="w-full border-b border-sky-100 bg-linear-to-b from-sky-50/90 to-white/80 px-3 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_10px_-3px_rgba(14,165,233,0.7)]">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <span className="h-4 w-40 animate-pulse rounded-full bg-sky-100" />
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
    <div className="w-full border-b border-sky-100 bg-linear-to-b from-sky-50/90 to-white/80 px-3 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
        {/* Left: Judul tanggal & tombol navigasi */}
        <div className="flex w-full items-center justify-between gap-2 md:w-auto">
          <button
            type="button"
            onClick={handlePrevDay}
            className="rounded-full border border-sky-100 bg-white p-2 text-sky-600 shadow-[0_4px_12px_-6px_rgba(14,165,233,0.5)] transition-all hover:bg-sky-50 hover:text-sky-700 active:scale-90"
            title="Hari Sebelumnya"
            aria-label="Hari Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_10px_-3px_rgba(14,165,233,0.7)]">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-sky-950 sm:text-base">
              {format(selected, 'EEEE, d MMMM yyyy', { locale: id })}
            </span>
            {isSelectedToday && (
              <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-[0_4px_10px_-4px_rgba(14,165,233,0.7)]">
                Hari Ini
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="rounded-full border border-sky-100 bg-white p-2 text-sky-600 shadow-[0_4px_12px_-6px_rgba(14,165,233,0.5)] transition-all hover:bg-sky-50 hover:text-sky-700 active:scale-90"
            title="Hari Berikutnya"
            aria-label="Hari Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Carousel 7 hari */}
        <div className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-2xl bg-sky-100/70 p-1 shadow-inner shadow-sky-200/40 md:w-auto">
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
                  'flex min-w-[72px] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 sm:min-w-[82px]',
                  isSelected
                    ? 'bg-sky-500 font-semibold text-white shadow-[0_6px_16px_-6px_rgba(14,165,233,0.8)]'
                    : 'text-sky-700 hover:bg-white/80 hover:text-sky-900'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isSelected ? 'text-sky-100' : 'text-sky-500'
                  )}
                >
                  {isToday ? 'Hari Ini' : format(dateItem, 'EEE', { locale: id })}
                </span>
                <span className="mt-0.5 text-sm font-bold">
                  {format(dateItem, 'd MMM', { locale: id })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset & date picker native */}
        <div className="flex w-full items-center justify-end gap-2 md:w-auto">
          {!isSelectedToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-sky-600 transition-all hover:bg-sky-100 hover:text-sky-800 active:scale-95"
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
              className="cursor-pointer rounded-full border border-sky-100 bg-white px-3.5 py-1.5 text-xs font-medium text-sky-900 shadow-[0_4px_12px_-6px_rgba(14,165,233,0.5)] focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}