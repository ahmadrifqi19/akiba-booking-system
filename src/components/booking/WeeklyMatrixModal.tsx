'use client';

import React, { useState, useEffect } from 'react';
import WeeklyMatrixGrid from './WeeklyMatrixGrid';
import { CalendarDays, X, Loader2, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/client';
import { addDays, format } from 'date-fns';
import { getTodayDateString } from '@/lib/utils';
import { Unit, BookingSchedule } from '@/types/database';
import { cn } from '@/lib/utils';

interface WeeklyMatrixModalProps {
  units: Unit[];
  onSelectDate: (dateStr: string) => void;
}

export default function WeeklyMatrixModal({
  units,
  onSelectDate,
}: WeeklyMatrixModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [matrixBookings, setMatrixBookings] = useState<BookingSchedule[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;
    let requestId = 0;

    const fetchWeeklyBookings = async (showLoading: boolean) => {
      const currentRequestId = ++requestId;
      if (showLoading) {
        setIsLoadingBookings(true);
      }
      setBookingError(null);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase belum dikonfigurasi.');
        }

        const todayStr = getTodayDateString();
        const [y, m, d] = todayStr.split('-').map(Number);
        const today = new Date(y, m - 1, d);
        const endDate = addDays(today, 6);

        const startDateStr = format(today, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('bookings')
          .select('id,tanggal_booking,jam_mulai,jam_selesai,durasi_efektif,nama_pelanggan,kode_unit,status_booking,sumber_booking')
          .gte('tanggal_booking', startDateStr)
          .lte('tanggal_booking', endDateStr);

        if (error) {
          throw error;
        }

        if (isActive && currentRequestId === requestId) {
          setMatrixBookings(data ?? []);
        }
      } catch (err) {
        console.error('Gagal mengambil data booking 7 hari:', err);
        if (isActive && currentRequestId === requestId) {
          setBookingError(
            err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data booking.'
          );
        }
      } finally {
        if (isActive && currentRequestId === requestId) {
          setIsLoadingBookings(false);
        }
      }
    };

    const channel = isSupabaseConfigured()
      ? supabase
          .channel('weekly-booking-matrix')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            () => {
              void fetchWeeklyBookings(false);
            }
          )
          .subscribe((status, error) => {
            const connected = status === 'SUBSCRIBED';
            setIsRealtimeConnected(connected);
            if (!connected && error) {
              console.error('Realtime booking 7 hari terputus:', error.message);
            }
          })
      : null;

    void fetchWeeklyBookings(true);

    return () => {
      isActive = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [isOpen]);

  return (
    <>
      {/* Tombol Pemicu Modal */}
      <button
        type="button"
        onClick={() => {
          setIsRealtimeConnected(false);
          setIsOpen(true);
        }}
        className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-2.5 text-xs font-bold text-sky-700 transition-all hover:bg-sky-100/80 active:scale-95 shadow-2xs w-full sm:w-auto"
      >
        <CalendarDays className="h-4 w-4 text-sky-500" />
        <span>Lihat Slot Ketersediaan 7 Hari ke Depan</span>
      </button>

      {/* Modal Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-xs sm:p-6 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-b from-sky-50/90 to-white shadow-[0_20px_50px_-20px_rgba(14,165,233,0.5)]">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-sky-100 bg-white/80 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-sky-950">
                    Slot Available 7 Hari ke Depan
                  </h3>
                  <p className="text-[11px] text-sky-600/80">
                    Klik pada salah satu kolom tanggal untuk memilih hari pada jadwal utama.
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isRealtimeConnected && (
                      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                    )}
                    <p
                      className={cn(
                        'text-[10px] font-medium font-mono',
                        isRealtimeConnected ? 'text-emerald-700' : 'text-sky-500'
                      )}
                    >
                      {isRealtimeConnected
                        ? 'Pembaruan langsung aktif'
                        : isSupabaseConfigured()
                          ? 'Menghubungkan real-time...'
                          : 'Mode Standalone'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-600 hover:bg-sky-50 transition-colors shadow-2xs"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body Konten Matrix */}
            <div className="overflow-y-auto p-4 sm:p-5 no-scrollbar">
              {isLoadingBookings ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2.5">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                  <span className="text-xs text-sky-600">Memuat data 7 hari dari database...</span>
                </div>
              ) : bookingError ? (
                <div role="alert" className="flex items-center justify-center py-12 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-700">
                  Gagal memuat jadwal: {bookingError}
                </div>
              ) : (
                <WeeklyMatrixGrid
                  units={units}
                  bookings={matrixBookings}
                  onSelectDate={(dateStr) => {
                    onSelectDate(dateStr);
                    setIsOpen(false);
                  }}
                />
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}