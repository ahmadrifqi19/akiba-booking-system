'use client';

import { useEffect, useState } from 'react';
import { useBookingData } from '@/hooks/useBookingData';
import Navbar from '@/components/layout/Navbar';
import DateNavigationBar from '@/components/booking/DateNavigationBar';
import StatusLegend from '@/components/booking/StatusLegend';
import TimelineGrid from '@/components/booking/TimelineGrid';
import BookingModal from '@/components/booking/BookingModal';
import BookingDetailModal from '@/components/booking/BookingDetailModal';
import { Unit, Booking, BookingFormData } from '@/types/database';
import {
  ShoppingCart,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  XCircle,
  CheckCircle,
} from 'lucide-react';

export default function KasirPOSPage() {
  // Inisialisasi state tanggal dengan fallback tanggal statis agar aman dari prerender SSR
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-23');

  // Ambil tanggal lokal browser secara aman tanpa memicu warning set-state-in-effect
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlotUnit, setSelectedSlotUnit] = useState<Unit | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('10:00');
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const {
    units,
    bookings,
    isLoading,
    createBooking,
    updateBookingStatus,
  } = useBookingData(selectedDate);

  // Metrics for today
  const activeBookings = bookings.filter((b) => b.status_booking === 'Active');
  const confirmedBookings = bookings.filter((b) => b.status_booking === 'Terkonfirmasi');
  const completedBookings = bookings.filter((b) => b.status_booking === 'Selesai');
  const totalDibatalkan = bookings.filter((b) => b.status_booking === 'Batal').length;

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Click on empty slot in grid -> Prefill modal
  const handleEmptySlotClick = (unit: Unit, time: string) => {
    setSelectedSlotUnit(unit);
    setSelectedSlotTime(time);
    setIsBookingModalOpen(true);
  };

  // Click on existing booking in grid -> Open detail modal
  const handleBookingClick = (booking: Booking) => {
    setSelectedBookingForDetail(booking);
  };

  // Submit Booking Form
  const handleCreateBookingSubmit = async (formData: BookingFormData) => {
    const res = await createBooking(formData);
    if (res.success) {
      showToast(`Booking ${formData.kode_unit} untuk ${formData.nama_pelanggan} berhasil dibuat!`);
    }
    return res;
  };

  return (
    <div className="flex min-h-full w-full flex-col bg-linear-to-b from-sky-50/40 to-white pb-14">
      <Navbar role="kasir" />

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 bg-sky-950 text-white px-4 py-3 rounded-2xl shadow-[0_10px_30px_-10px_rgba(14,165,233,0.5)] flex items-center gap-2 text-xs font-bold border border-sky-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Date Navigation Bar */}
      <DateNavigationBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 space-y-4">

        {/* Top Header Bar */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-sky-950 tracking-tight">
                  Kasir POS
                </h1>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                  Staff Operator
                </span>
              </div>
              <p className="text-xs text-sky-600/80">
                Input reservasi Booking atau pelanggan Walk-in secara real-time.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedSlotUnit(units[0] || null);
                setSelectedSlotTime('12:00');
                setIsBookingModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_20px_-6px_rgba(14,165,233,0.7)] hover:bg-sky-600 transition-all active:scale-95 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Booking Manual</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards (Active, Terkonfirmasi, Selesai, Dibatalkan) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <div className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-white p-4 shadow-2xs transition-all hover:shadow-md">
            <span className="text-[11px] text-sky-600 flex items-center gap-1.5 font-bold">
              <Flame className="h-3.5 w-3.5 text-emerald-500" />
              Sedang Main (Active)
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-sky-950 font-mono">
                {activeBookings.length}
              </span>
              <span className="text-xs text-sky-500">/ {units.length} Unit</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-white p-4 shadow-2xs transition-all hover:shadow-md">
            <span className="text-[11px] text-sky-600 flex items-center gap-1.5 font-bold">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              Terkonfirmasi (Jadwal)
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-sky-950 font-mono">
                {confirmedBookings.length}
              </span>
              <span className="text-xs text-sky-500">Sesi</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xs transition-all hover:shadow-md">
            <span className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-bold">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Selesai
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-emerald-950 font-mono">
                {completedBookings.length}
              </span>
              <span className="text-xs text-emerald-500">Sesi</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-rose-100 bg-white p-4 shadow-2xs transition-all hover:shadow-md">
            <span className="text-[11px] text-rose-600 flex items-center gap-1.5 font-bold">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Dibatalkan
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-rose-950 font-mono">
                {totalDibatalkan}
              </span>
              <span className="text-xs text-rose-500">Sesi</span>
            </div>
          </div>

        </div>

        {/* Legend */}
        <StatusLegend />

        {/* Interactive Timeline Grid */}
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2.5 rounded-3xl border border-sky-100 bg-white shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)]">
            <div className="h-7 w-7 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-xs text-sky-600 font-medium">Memuat grid interaktif...</span>
          </div>
        ) : (
          <TimelineGrid
            units={units}
            bookings={bookings}
            selectedDate={selectedDate}
            isKasirMode={true}
            onSlotClick={handleEmptySlotClick}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      {/* Booking Form Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          units={units}
          initialUnit={selectedSlotUnit}
          initialTime={selectedSlotTime}
          selectedDate={selectedDate}
          onSubmit={handleCreateBookingSubmit}
        />
      )}

      {/* Booking Detail & Status Update Modal */}
      <BookingDetailModal
        booking={selectedBookingForDetail}
        isOpen={Boolean(selectedBookingForDetail)}
        onClose={() => setSelectedBookingForDetail(null)}
        isKasirMode={true}
        onUpdateStatus={async (id, status, statusBayar) => {
          const res = await updateBookingStatus(id, status, statusBayar);
          if (res.success) {
            showToast(`Status booking berhasil diubah menjadi ${status}`);
          }
          return res;
        }}
      />
    </div>
  );
}