'use client';

import React, { useState, useRef } from 'react';
import { Unit, BookingSchedule } from '@/types/database';
import {
  getOperationalBookingStart,
  getOperationalTimeSlots,
  formatRupiah,
  formatTimeShort,
} from '@/lib/utils';
import { Gamepad2, Clock, CheckCircle2, Plus, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineGridProps<TBooking extends BookingSchedule> {
  units: Unit[];
  bookings: TBooking[];
  selectedDate: string;
  isKasirMode?: boolean;
  onSlotClick?: (unit: Unit, startTime: string) => void;
  onBookingClick?: (booking: TBooking) => void;
}

export default function TimelineGrid<TBooking extends BookingSchedule>({
  units,
  bookings,
  selectedDate,
  isKasirMode = false,
  onSlotClick,
  onBookingClick,
}: TimelineGridProps<TBooking>) {
  const [mobileView, setMobileView] = useState<'grid' | 'list'>('list');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlots = getOperationalTimeSlots(selectedDate).map((slot) => slot.value);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (scrollLeft > 10) {
      if (!isScrolled) setIsScrolled(true);
    } else {
      if (isScrolled) setIsScrolled(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      {/* Mobile Toggle View */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2.5 sm:hidden">
        <span className="text-xs font-semibold text-slate-700">Tampilan jadwal</span>
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
          <button
            type="button"
            onClick={() => setMobileView('grid')}
            aria-pressed={mobileView === 'grid'}
            className={cn(
              'flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all active:scale-95',
              mobileView === 'grid'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setMobileView('list')}
            aria-pressed={mobileView === 'list'}
            className={cn(
              'flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all active:scale-95',
              mobileView === 'list'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-slate-600 hover:bg-white'
            )}
          >
            <List className="h-3.5 w-3.5" />
            List per Unit
          </button>
        </div>
      </div>

      {/* Mobile List View */}
      {mobileView === 'list' && (
        <div className="space-y-3 p-2.5 sm:hidden">
          {units.map((unit) => {
            const unitBookings = bookings.filter(
              (booking) =>
                booking.kode_unit === unit.kode_unit &&
                booking.status_booking !== 'Batal'
            );
            let skipCount = 0;

            return (
              <section
                key={unit.kode_unit}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs"
              >
                <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold tracking-tight text-slate-900 text-sm">
                      {unit.kode_unit}
                    </h3>
                    <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {unit.kelas?.match(/PS[345]/)?.[0] || unit.kelas || 'Unit'}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-slate-900">
                    {formatRupiah(unit.tarif_per_jam)}/jam
                  </span>
                </header>

                <div className="overflow-x-auto no-scrollbar p-2">
                  <div className="flex w-max items-center gap-1.5">
                    {timeSlots.map((slotTime, slotIdx) => {
                      if (skipCount > 0) {
                        skipCount -= 1;
                        return null;
                      }

                      const slotMins = getOperationalBookingStart(slotTime, selectedDate);
                      const activeBooking = unitBookings.find((booking) => {
                        const start = getOperationalBookingStart(booking.jam_mulai, selectedDate);
                        const end = start + booking.durasi_efektif * 60;
                        return slotMins >= start && slotMins < end;
                      });

                      if (activeBooking) {
                        const start = getOperationalBookingStart(activeBooking.jam_mulai, selectedDate);
                        const end = start + activeBooking.durasi_efektif * 60;
                        const isFirstVisibleSlot =
                          slotMins === start || (slotIdx === 0 && slotMins > start);

                        if (!isFirstVisibleSlot) return null;

                        const span = Math.max(
                          1,
                          Math.round(
                            (Math.min(end, 26 * 60) - Math.max(slotMins, timeSlots.length > 0 ? getOperationalBookingStart(timeSlots[0], selectedDate) : 0)) / 30
                          )
                        );
                        skipCount = span - 1;
                        const isActive = activeBooking.status_booking === 'Active';
                        const isFinished = activeBooking.status_booking === 'Selesai';

                        return (
                          <button
                            key={slotTime}
                            type="button"
                            onClick={() => onBookingClick?.(activeBooking)}
                            style={{ width: `${Math.max(span * 85, 145)}px` }}
                            className={cn(
                              'flex h-[68px] shrink-0 flex-col justify-between rounded-lg border p-2 text-left transition-all active:scale-[0.98]',
                              isActive
                                ? 'border-emerald-300 bg-emerald-100/90 text-emerald-950'
                                : isFinished
                                  ? 'border-slate-300 bg-slate-200/80 text-slate-700'
                                  : 'border-blue-200 bg-blue-100/90 text-blue-950'
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isActive ? (
                                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-600" />
                              ) : isFinished ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                              ) : (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#007AFF]" />
                              )}
                              <span className="truncate text-[11px] font-bold leading-tight min-w-0">
                                {activeBooking.sumber_booking} - {activeBooking.nama_pelanggan}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 font-mono text-[10px] opacity-80">
                              <Clock className="h-3 w-3 shrink-0 text-slate-600" />
                              <span>
                                {`${formatTimeShort(activeBooking.jam_mulai)} - ${formatTimeShort(activeBooking.jam_selesai)}`}
                              </span>
                            </div>

                            {isKasirMode && (
                              <span className="text-[9px] font-medium">{getPaymentStatus(activeBooking)}</span>
                            )}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={slotTime}
                          type="button"
                          onClick={() => isKasirMode && onSlotClick?.(unit, slotTime)}
                          disabled={!isKasirMode}
                          className={cn(
                            'flex h-[68px] w-[65px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-600 transition-colors',
                            isKasirMode
                              ? 'hover:border-blue-300 hover:bg-blue-50/50 hover:text-[#007AFF] active:scale-95'
                              : 'cursor-default'
                          )}
                        >
                          <span className="font-mono text-[11px] font-medium text-slate-700">{slotTime}</span>
                          <span className="text-[9px] text-emerald-600 font-semibold">Kosong</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Desktop / Grid View */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          'relative max-h-[75vh] overflow-x-auto overflow-y-auto no-scrollbar scroll-smooth touch-auto [-webkit-overflow-scrolling:touch]',
          mobileView === 'list' ? 'hidden sm:block' : 'block'
        )}
      >
        <table className="w-full min-w-[1300px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-white/90">
              <th
                className={cn(
                  'timeline-sticky-corner border-r border-b border-slate-200/80 bg-white/90 p-2 sm:p-3.5 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-[1px_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300',
                  isScrolled
                    ? 'w-20 min-w-[5rem] max-w-[5rem]'
                    : 'w-52 min-w-[13rem] max-w-[13rem]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-900 text-[10px] sm:text-xs">
                    <Gamepad2 className="h-4 w-4 text-slate-700 shrink-0" />
                    {!isScrolled && <span>Unit Konsol PS</span>}
                  </span>
                  {!isScrolled && (
                    <span className="hidden sm:inline-block text-[11px] text-slate-500 font-normal">
                      {units.length} Unit
                    </span>
                  )}
                </div>
              </th>

              {timeSlots.map((time) => {
                const isFullHour = time.endsWith(':00');
                return (
                  <th
                    key={time}
                    className={cn(
                      'timeline-sticky-top min-w-[70px] border-b border-r border-slate-200/80 bg-white/90 px-2 py-3 text-center text-xs backdrop-blur-md transition-colors',
                      isFullHour
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-500 font-normal'
                    )}
                  >
                    <span className="font-mono text-[11px]">{time}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {units.map((unit) => {
              const unitBookings = bookings.filter(
                (b) => b.kode_unit === unit.kode_unit && b.status_booking !== 'Batal'
              );

              let skipCount = 0;

              return (
                <tr key={unit.kode_unit} className="transition-colors hover:bg-slate-50/40">
                  <td
                    className={cn(
                      'timeline-sticky-left border-r border-slate-200/80 bg-white/95 p-2 sm:p-3.5 font-medium text-slate-800 shadow-[1px_0_3px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300',
                      isScrolled
                        ? 'w-20 min-w-[5rem] max-w-[5rem]'
                        : 'w-52 min-w-[13rem] max-w-[13rem]'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight truncate">
                          {unit.kode_unit}
                        </span>
                        {!isScrolled && (
                          <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                            {unit.kelas?.match(/PS[345]/)?.[0] || unit.kelas || 'Unit'}
                          </span>
                        )}
                      </div>

                      {!isScrolled && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="max-w-[120px] truncate" title={unit.preferensi_zona}>
                            {unit.preferensi_zona}
                          </span>
                          <span className="whitespace-nowrap font-mono font-semibold text-slate-900">
                            {formatRupiah(unit.tarif_per_jam)}/jam
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {timeSlots.map((slotTime, slotIdx) => {
                    if (skipCount > 0) {
                      skipCount--;
                      return null;
                    }

                    const slotMins = getOperationalBookingStart(slotTime, selectedDate);

                    const activeBooking = unitBookings.find((b) => {
                      const bStart = getOperationalBookingStart(b.jam_mulai, selectedDate);
                      const bEnd = bStart + b.durasi_efektif * 60;
                      return slotMins >= bStart && slotMins < bEnd;
                    });

                    if (activeBooking) {
                      const bStart = getOperationalBookingStart(activeBooking.jam_mulai, selectedDate);
                      const bEnd = bStart + activeBooking.durasi_efektif * 60;

                      const isFirstVisibleSlot = slotMins === bStart || (slotIdx === 0 && slotMins > bStart);

                      if (isFirstVisibleSlot) {
                        const firstSlotMinutes = getOperationalBookingStart(timeSlots[0], selectedDate);
                        const effectiveStartMins = Math.max(slotMins, firstSlotMinutes);
                        const effectiveEndMins = Math.min(bEnd, 26 * 60);
                        const durationMins = effectiveEndMins - effectiveStartMins;
                        const span = Math.max(1, Math.round(durationMins / 30));
                        skipCount = span - 1;

                        const isSedangMain = activeBooking.status_booking === 'Active';
                        const isSelesai = activeBooking.status_booking === 'Selesai';

                        return (
                          <td
                            key={slotTime}
                            colSpan={span}
                            onClick={() => onBookingClick && onBookingClick(activeBooking)}
                            className="p-1 border-r border-b border-slate-100 cursor-pointer"
                          >
                            <div
                              className={cn(
                                'h-13 rounded-lg p-2 flex flex-col justify-between transition-all select-none border shadow-2xs',
                                isSedangMain
                                  ? 'border-emerald-300 bg-emerald-100/90 text-emerald-950 hover:bg-emerald-100'
                                  : isSelesai
                                  ? 'border-slate-300 bg-slate-200/80 text-slate-700 hover:bg-slate-200'
                                  : 'border-blue-200 bg-blue-100/90 text-blue-950 hover:bg-blue-100'
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex min-w-0 items-center gap-1.5 font-bold text-xs">
                                  {isSedangMain ? (
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                                  ) : isSelesai ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                                  ) : (
                                    <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-[#007AFF]" />
                                  )}
                                  <span className="line-clamp-1 min-w-0 whitespace-normal leading-tight font-semibold">
                                    {activeBooking.sumber_booking} - {activeBooking.nama_pelanggan}
                                  </span>
                                </div>

                                <span
                                  className={cn(
                                    'whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold shrink-0',
                                    isSedangMain
                                      ? 'border-emerald-200 bg-white text-emerald-900'
                                      : isSelesai
                                        ? 'border-slate-200 bg-white text-slate-600'
                                        : 'border-blue-200 bg-white text-blue-900'
                                  )}
                                >
                                  {isSedangMain ? 'MAIN' : `${activeBooking.durasi_efektif} jam`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1 font-mono text-[10px] opacity-80">
                                  <Clock className="h-3 w-3 shrink-0 text-slate-600" />
                                  <span>
                                    {`${formatTimeShort(activeBooking.jam_mulai)} - ${formatTimeShort(activeBooking.jam_selesai)}`}
                                  </span>
                                </div>
                                {isKasirMode && (
                                  <span className="font-semibold text-[10px] uppercase tracking-wider opacity-85">
                                    {getPaymentStatus(activeBooking)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }
                    }

                    return (
                      <td
                        key={slotTime}
                        onClick={() => isKasirMode && onSlotClick && onSlotClick(unit, slotTime)}
                        className={cn(
                          'h-15 border-r border-b border-slate-100 p-1 transition-colors',
                          isKasirMode
                            ? 'group cursor-pointer hover:bg-slate-50'
                            : 'hover:bg-blue-50/50'
                        )}
                        title={
                          isKasirMode
                            ? `Klik untuk booking ${unit.kode_unit} jam ${slotTime}`
                            : `${unit.kode_unit} tersedia jam ${slotTime}`
                        }
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300 transition-all group-hover:border-blue-300 group-hover:bg-blue-50/50 group-hover:text-[#007AFF]">
                          {isKasirMode ? (
                            <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <span className="text-[10px] text-slate-300 select-none">•</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPaymentStatus(booking: BookingSchedule): string {
  return 'status_pembayaran' in booking && typeof booking.status_pembayaran === 'string'
    ? booking.status_pembayaran
    : '';
}