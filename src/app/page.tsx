'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingData } from '@/hooks/useBookingData';
import { getOperationalStartHour, getTodayDateString } from '@/lib/utils';
import { supabase } from '@/lib/client';
import DateNavigationBar from '@/components/booking/DateNavigationBar';
import StatusLegend from '@/components/booking/StatusLegend';
import TimelineGrid from '@/components/booking/TimelineGrid';
import BookingDetailModal from '@/components/booking/BookingDetailModal';
import WeeklyMatrixModal from '@/components/booking/WeeklyMatrixModal';
import { BookingSchedule, Booking } from '@/types/database';
import { Radio, RefreshCw, SlidersHorizontal, Gamepad2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Daftar opsi kategori filter cepat
const FILTER_OPTIONS = ['Semua', 'Smoking', 'Non Smoking', 'PS5', 'PS4', 'VVIP', 'VIP', 'Reguler'];

export default function CustomerDisplayPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeBookingModal, setActiveBookingModal] = useState<BookingSchedule | null>(null);

  // State untuk menyimpan filter kategori unit yang aktif
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');

  const {
    units,
    bookings,
    isLoading,
    isRealtimeActive,
    isSupabaseConfigured,
    refetch,
  } = useBookingData(selectedDate, { publicOnly: true });

  // Fungsi penanganan update status booking secara real-time
  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: Booking['status_booking'],
    statusBayar?: Booking['status_pembayaran']
  ) => {
    try {
      const updatePayload: {
        status_booking: Booking['status_booking'];
        status_pembayaran?: Booking['status_pembayaran'];
      } = { status_booking: status };
      
      if (statusBayar) {
        updatePayload.status_pembayaran = statusBayar;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (error) throw error;

      // Tarik ulang data dan refresh router secara instan
      await refetch();
      router.refresh();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Gagal memperbarui status.' 
      };
    }
  };

  // Logika penyaringan unit berdasarkan filter yang dipilih secara presisi
  const filteredUnits = units.filter((unit) => {
    if (selectedFilter === 'Semua') return true;

    const kelas = unit.kelas?.toUpperCase() || '';
    const zona = unit.preferensi_zona?.toUpperCase() || '';
    const target = selectedFilter.toUpperCase();

    if (target === 'SMOKING') {
      const isActuallySmoking = (kelas.includes('SMOKING') || zona.includes('SMOKING')) &&
                                !(kelas.includes('NON') || zona.includes('NON') || kelas.includes('NON-SMOKING'));
      return isActuallySmoking;
    }

    if (target === 'NON SMOKING') {
      return kelas.includes('NON') || zona.includes('NON') || kelas.includes('NON-SMOKING');
    }

    const kelasMatch = kelas.includes(target);
    const zonaMatch = zona.includes(target);

    return kelasMatch || zonaMatch;
  });

  const operationalHours = `${String(getOperationalStartHour(selectedDate)).padStart(2, '0')}:00 - 02:00`;

  return (
    <div className="flex min-h-full w-full flex-col bg-linear-to-b from-sky-50/40 to-white pb-12">
      {/* 7-Day Date Navigation */}
      <DateNavigationBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 space-y-4">
        
        {/* Header Bar yang diselaraskan */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
                <Gamepad2 className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-sky-950 tracking-tight">
                Jadwal Ketersediaan Akiba Core
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-sky-700/80">
              Pantau jadwal ketersediaan room secara live ({operationalHours}).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-sky-100 text-xs shadow-2xs">
              <Radio
                className={`h-3.5 w-3.5 ${
                  isRealtimeActive ? 'text-emerald-500 animate-pulse' : 'text-sky-300'
                }`}
              />
              <span className="text-sky-900 font-mono text-[11px] font-semibold">
                {isSupabaseConfigured
                  ? isRealtimeActive
                    ? 'Operational Terhubung'
                    : 'Menghubungkan...'
                  : 'Mode Standalone (Live Sync)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              className="p-2.5 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 text-sky-600 hover:text-sky-900 transition-all shadow-2xs active:scale-95"
              title="Refresh Jadwal"
              aria-label="Refresh Jadwal"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tombol Pemicu Modal Rekapitulasi Slot 7 Hari */}
        <div className="flex justify-start">
          <WeeklyMatrixModal
            units={filteredUnits}
            onSelectDate={(dateStr) => {
              setSelectedDate(dateStr);
            }}
          />
        </div>

        {/* Status Legend Guide */}
        <StatusLegend />

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 text-sky-600 pr-1 shrink-0 text-xs font-bold">
            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-500" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          {FILTER_OPTIONS.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  'whitespace-nowrap rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 border shadow-2xs',
                  isActive
                    ? 'bg-sky-500 text-white border-sky-500 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                    : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                )}
              >
                {filter === 'Semua' ? 'Semua Unit' : filter}
              </button>
            );
          })}
        </div>

        {/* Visual Timeline Grid dengan Data Ter-filter */}
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2.5 rounded-3xl border border-sky-100 bg-white shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)]">
            <div className="h-7 w-7 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-xs text-sky-600 font-medium">Memuat jadwal visual unit...</span>
          </div>
        ) : (
          <TimelineGrid
            units={filteredUnits}
            bookings={bookings}
            selectedDate={selectedDate}
            isKasirMode={false}
            onBookingClick={(b) => setActiveBookingModal(b)}
          />
        )}

        {/* Footer / Call to Action Booking Langsung */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-sky-100 bg-white p-4 sm:p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)]">
          <div className="space-y-0.5 text-center sm:text-left">
            <h3 className="text-xs sm:text-sm font-bold text-sky-950">
              Sudah menemukan jadwal kamu? Yuk booking sekarang!
            </h3>
            <p className="text-[11px] text-sky-600/80">
              Amankan slot room favoritmu di Akiba Core secara instan.
            </p>
          </div>

          <a
            href="https://dragonplay.id/portal.php?q=akibacore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_20px_-6px_rgba(14,165,233,0.7)] hover:bg-sky-600 transition-all active:scale-95 shrink-0"
          >
            <span>Booking Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Modal Detail Booking dengan Sinkronisasi Router Refresh */}
      {activeBookingModal && (
        <BookingDetailModal
          isOpen={!!activeBookingModal}
          booking={activeBookingModal}
          onClose={() => setActiveBookingModal(null)}
          isKasirMode={true}
          units={units}
          onUpdateStatus={handleUpdateBookingStatus}
          onBookingUpdated={() => {
            void refetch();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}