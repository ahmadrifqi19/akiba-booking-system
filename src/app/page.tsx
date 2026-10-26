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
import { Radio, RefreshCw, SlidersHorizontal } from 'lucide-react';
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
    <div className="flex min-h-full w-full flex-col bg-canvas pb-12">
      {/* 7-Day Date Navigation */}
      <DateNavigationBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 space-y-4">
        {/* Clean Header Bar */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Jadwal Ketersediaan Akiba Core
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Pantau jadwal ketersediaan room secara live ({operationalHours}).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Radio
                className={`h-3.5 w-3.5 ${
                  isRealtimeActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="text-slate-700 font-mono text-[11px]">
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
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
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
          <div className="flex items-center gap-1 text-slate-400 pr-1 shrink-0 text-xs font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
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
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shrink-0 border shadow-2xs',
                  isActive
                    ? 'bg-[#007AFF] text-white border-[#007AFF]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                {filter === 'Semua' ? 'Semua Unit' : filter}
              </button>
            );
          })}
        </div>

        {/* Visual Timeline Grid dengan Data Ter-filter */}
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="h-7 w-7 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Memuat jadwal visual unit...</span>
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
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="space-y-0.5 text-center sm:text-left">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Sudah menemukan jadwal kamu? Yuk booking sekarang!
            </h3>
          </div>

          <a
            href="https://dragonplay.id/portal.php?q=akibacore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#007AFF] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-transform active:scale-95 shrink-0"
          >
            <span>Booking Sekarang</span>
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