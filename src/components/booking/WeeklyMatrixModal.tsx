'use client';

import React, { useState, useEffect } from 'react';
import WeeklyMatrixGrid from './WeeklyMatrixGrid';
import { CalendarDays, X, Loader2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/client';
import { addDays, format } from 'date-fns';
import { getTodayDateString } from '@/lib/utils';
import { Unit, BookingSchedule } from '@/types/database';

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
      <button
        type="button"
        onClick={() => {
          setIsRealtimeConnected(false);
          setIsOpen(true);
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-[#007AFF] transition-all hover:bg-blue-100/80 active:scale-95 shadow-2xs w-full sm:w-auto"
      >
        <CalendarDays className="h-4 w-4" />
        <span>Lihat Slot Ketersediaan 7 Hari ke Depan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs sm:p-6">
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#007AFF]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Slot Available 7 Hari ke Depan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Klik pada salah satu kolom tanggal untuk memilih hari pada jadwal utama.
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isRealtimeConnected ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {isRealtimeConnected
                      ? 'Pembaruan langsung aktif'
                      : isSupabaseConfigured()
                        ? 'Realtime belum terhubung'
                        : 'Realtime tidak tersedia'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5">
              {isLoadingBookings ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#007AFF]" />
                  <span className="text-xs text-slate-500">Memuat data 7 hari dari database...</span>
                </div>
              ) : bookingError ? (
                <p role="alert" className="py-12 text-center text-sm text-red-600">
                  Gagal memuat jadwal: {bookingError}
                </p>
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