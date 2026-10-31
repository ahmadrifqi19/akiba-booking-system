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

/**
 * Palet (Tailwind):
 * - Dasar      : sky-50 / white
 * - Utama      : sky-400 / sky-500 (tombol aktif, aksen)
 * - Booking    : sky-100 -> sky-50 (terjadwal)
 * - Sedang main: emerald-100 -> teal-50
 * - Selesai    : slate-100
 * - Bayangan   : rgba(14,165,233,.x) supaya lembut dan kebiruan
 */

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
    <div className="relative w-full overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-b from-sky-50/80 to-white shadow-[0_12px_40px_-20px_rgba(14,165,233,0.45)]">
      {/* Mobile Toggle View */}
      <div className="flex items-center justify-between border-b border-sky-100 bg-white/60 px-3.5 py-3 backdrop-blur-sm sm:hidden">
        <span className="text-xs font-semibold text-sky-900">Tampilan jadwal</span>
        <div className="flex items-center gap-1 rounded-full bg-sky-100/80 p-1 shadow-inner shadow-sky-200/40">
          <button
            type="button"
            onClick={() => setMobileView('grid')}
            aria-pressed={mobileView === 'grid'}
            className={cn(
              'flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-95',
              mobileView === 'grid'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-700 hover:bg-white/80'
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
              'flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-95',
              mobileView === 'list'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-700 hover:bg-white/80'
            )}
          >
            <List className="h-3.5 w-3.5" />
            List per Unit
          </button>
        </div>
      </div>

      {/* Mobile List View */}
      {mobileView === 'list' && (
        <div className="space-y-3.5 p-3 sm:hidden">
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
                className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_8px_24px_-14px_rgba(14,165,233,0.4)]"
              >
                <header className="flex items-center justify-between gap-2 border-b border-sky-100 bg-linear-to-r from-sky-100/70 to-sky-50/40 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_10px_-3px_rgba(14,165,233,0.7)]">
                      <Gamepad2 className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-sky-950">
                      {unit.kode_unit}
                    </h3>

                    {/* Badge Konsol */}
                    <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                      {unit.kelas?.match(/PS[345]/)?.[0] || unit.kelas || 'Unit'}
                    </span>

                    {/* Badge Tambahan: Smoking / Non Smoking */}
                    {(unit.kelas?.toUpperCase().includes('SMOKING') || unit.preferensi_zona?.toUpperCase().includes('SMOKING')) && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        unit.kelas?.toUpperCase().includes('NON') || unit.preferensi_zona?.toUpperCase().includes('NON')
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {unit.kelas?.toUpperCase().includes('NON') || unit.preferensi_zona?.toUpperCase().includes('NON')
                          ? 'Non Smoking'
                          : 'Smoking'}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-sky-900 shadow-2xs ring-1 ring-sky-100">
                    {formatRupiah(unit.tarif_per_jam)}/jam
                  </span>
                </header>

                <div className="no-scrollbar overflow-x-auto p-2.5">
                  <div className="flex w-max items-center gap-2">
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
                              'flex h-[72px] shrink-0 flex-col justify-between rounded-2xl border p-2.5 text-left transition-all active:scale-[0.97]',
                              isActive
                                ? 'border-emerald-200 bg-linear-to-br from-emerald-100 to-teal-50 text-emerald-950 shadow-[0_6px_16px_-8px_rgba(16,185,129,0.6)]'
                                : isFinished
                                  ? 'border-slate-200 bg-linear-to-br from-slate-100 to-slate-50 text-slate-600'
                                  : 'border-sky-200 bg-linear-to-br from-sky-100 to-sky-50 text-sky-950 shadow-[0_6px_16px_-8px_rgba(14,165,233,0.6)]'
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-1.5">
                              {isActive ? (
                                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                              ) : isFinished ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              ) : (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                              )}
                              <span className="min-w-0 truncate text-[11px] font-bold leading-tight">
                                {activeBooking.sumber_booking} - {activeBooking.nama_pelanggan}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 font-mono text-[10px] opacity-80">
                              <Clock className="h-3 w-3 shrink-0" />
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
                            'flex h-[72px] w-[66px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-sky-100 bg-sky-50/60 text-sky-800 transition-all',
                            isKasirMode
                              ? 'hover:border-sky-300 hover:bg-sky-100/70 hover:text-sky-600 active:scale-95'
                              : 'cursor-default'
                          )}
                        >
                          <span className="font-mono text-[11px] font-medium">{slotTime}</span>
                          <span className="rounded-full bg-emerald-100/80 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                            Kosong
                          </span>
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
        <table className="w-full min-w-[1300px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th
                className={cn(
                  'timeline-sticky-corner border-b border-r border-sky-100 bg-sky-50/95 p-2 text-xs font-bold text-sky-950 shadow-[2px_2px_8px_-4px_rgba(14,165,233,0.25)] backdrop-blur-md transition-all duration-300 sm:p-3.5',
                  isScrolled
                    ? 'w-20 min-w-[5rem] max-w-[5rem]'
                    : 'w-52 min-w-[13rem] max-w-[13rem]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] text-sky-950 sm:text-xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_10px_-3px_rgba(14,165,233,0.7)]">
                      <Gamepad2 className="h-4 w-4" />
                    </span>
                    {!isScrolled && <span>Unit Konsol PS</span>}
                  </span>
                  {!isScrolled && (
                    <span className="hidden rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-sky-600 ring-1 ring-sky-100 sm:inline-block">
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
                      'timeline-sticky-top min-w-[70px] border-b border-r border-sky-100 bg-sky-50/95 px-2 py-3 text-center text-xs backdrop-blur-md transition-colors',
                      isFullHour
                        ? 'font-semibold text-sky-900'
                        : 'font-normal text-sky-400'
                    )}
                  >
                    <span className="font-mono text-[11px]">{time}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="text-xs">
            {units.map((unit) => {
              const unitBookings = bookings.filter(
                (b) => b.kode_unit === unit.kode_unit && b.status_booking !== 'Batal'
              );

              let skipCount = 0;

              return (
                <tr key={unit.kode_unit} className="group/row transition-colors">
                  <td
                    className={cn(
                      'timeline-sticky-left border-b border-r border-sky-100 bg-white/95 p-2 font-medium text-sky-950 shadow-[2px_0_8px_-4px_rgba(14,165,233,0.25)] backdrop-blur-md transition-all duration-300 sm:p-3.5',
                      isScrolled
                        ? 'w-20 min-w-[5rem] max-w-[5rem]'
                        : 'w-52 min-w-[13rem] max-w-[13rem]'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-bold tracking-tight text-sky-950 sm:text-sm">
                          {unit.kode_unit}
                        </span>
                        {!isScrolled && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                            {unit.kelas?.match(/PS[345]/)?.[0] || unit.kelas || 'Unit'}
                          </span>
                        )}
                      </div>

                      {!isScrolled && (
                        <div className="flex items-center justify-between text-[11px] text-sky-600/80">
                          <span className="max-w-[120px] truncate" title={unit.preferensi_zona}>
                            {unit.preferensi_zona}
                          </span>
                          <span className="whitespace-nowrap font-mono font-semibold text-sky-900">
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
                            className="cursor-pointer border-b border-r border-sky-50 p-1"
                          >
                            <div
                              className={cn(
                                'flex h-13 select-none flex-col justify-between rounded-2xl border p-2 transition-all hover:-translate-y-px',
                                isSedangMain
                                  ? 'border-emerald-200 bg-linear-to-br from-emerald-100 to-teal-50 text-emerald-950 shadow-[0_6px_16px_-8px_rgba(16,185,129,0.6)]'
                                  : isSelesai
                                    ? 'border-slate-200 bg-linear-to-br from-slate-100 to-slate-50 text-slate-600 hover:from-slate-200/70'
                                    : 'border-sky-200 bg-linear-to-br from-sky-100 to-sky-50 text-sky-950 shadow-[0_6px_16px_-8px_rgba(14,165,233,0.6)]'
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
                                  {isSedangMain ? (
                                    <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                  ) : isSelesai ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  ) : (
                                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                                  )}
                                  <span className="line-clamp-1 min-w-0 whitespace-normal font-semibold leading-tight">
                                    {activeBooking.sumber_booking} - {activeBooking.nama_pelanggan}
                                  </span>
                                </div>

                                <span
                                  className={cn(
                                    'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold',
                                    isSedangMain
                                      ? 'bg-emerald-500 text-white'
                                      : isSelesai
                                        ? 'bg-white text-slate-500 ring-1 ring-slate-200'
                                        : 'bg-white text-sky-700 ring-1 ring-sky-200'
                                  )}
                                >
                                  {isSedangMain ? 'MAIN' : `${activeBooking.durasi_efektif} jam`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1 font-mono text-[10px] opacity-80">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span>
                                    {`${formatTimeShort(activeBooking.jam_mulai)} - ${formatTimeShort(activeBooking.jam_selesai)}`}
                                  </span>
                                </div>
                                {isKasirMode && (
                                  <span className="text-[10px] font-semibold opacity-85">
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
                          'h-15 border-b border-r border-sky-50 p-1 transition-colors',
                          isKasirMode ? 'group cursor-pointer' : 'hover:bg-sky-50/60'
                        )}
                        title={
                          isKasirMode
                            ? `Klik untuk booking ${unit.kode_unit} jam ${slotTime}`
                            : `${unit.kode_unit} tersedia jam ${slotTime}`
                        }
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-sky-100/80 bg-white/70 text-sky-200 transition-all group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:text-sky-500 group-hover:shadow-[0_4px_12px_-6px_rgba(14,165,233,0.6)]">
                          {isKasirMode ? (
                            <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          ) : (
                            <span className="select-none text-[10px] text-sky-200">•</span>
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