'use client';

import React from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn, getTodayDateString } from '@/lib/utils';

interface DateNavigationBarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function DateNavigationBar({
  selectedDate,
  onSelectDate,
}: DateNavigationBarProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [todayStr, setTodayStr] = React.useState<string>(selectedDate || '2026-10-23');

  React.useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setIsMounted(true);
      setTodayStr(getTodayDateString());
    });
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Parse string YYYY-MM-DD secara aman tanpa terpengaruh timezone offset
  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const today = parseSafeDate(todayStr);
  const selected = parseSafeDate(selectedDate || todayStr);

  // Generate 7 hari berturut-turut mulai dari hari ini
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const handlePrevDay = () => {
    const prev = addDays(selected, -1);
    onSelectDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(selected, 1);
    onSelectDate(format(next, 'yyyy-MM-dd'));
  };

  return (
    <div className="w-full border-b border-slate-200/80 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Quick Date Title & Navigation Controls */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button
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
              {isMounted ? format(selected, 'EEEE, d MMMM yyyy', { locale: id }) : selectedDate}
            </span>
            {isMounted && isSameDay(selected, today) && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                Hari Ini
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="rounded-lg border border-slate-200/80 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
            title="Hari Berikutnya"
            aria-label="Hari Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: 7-Day Quick Buttons Segmented Carousel */}
        <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 pb-1 sm:pb-1 md:w-auto no-scrollbar">
          {next7Days.map((dateItem, idx) => {
            const dateStr = format(dateItem, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isToday = idx === 0;

            return (
              <button
                key={dateStr}
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
                  {isToday ? 'Hari Ini' : isMounted ? format(dateItem, 'EEE', { locale: id }) : ''}
                </span>
                <span className="text-sm font-bold mt-0.5">
                  {isMounted ? format(dateItem, 'd MMM', { locale: id }) : dateStr}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset & Native Date Picker */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {isMounted && !isSameDay(selected, today) && (
            <button
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
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}