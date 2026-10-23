'use client';

import { useEffect, useState } from 'react';
import { useBookingData } from '@/hooks/useBookingData';
import { formatRupiah } from '@/lib/utils';
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
  DollarSign,
  Clock,
  CreditCard,
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
  const totalOmzetHariIni = bookings
    .filter((b) => b.status_booking !== 'Batal')
    .reduce((acc, curr) => acc + curr.total, 0);
  const totalBelumDibayar = bookings
    .filter(
      (booking) =>
        booking.status_booking !== 'Batal' &&
        booking.status_pembayaran === 'Belum Bayar'
    )
    .reduce((total, booking) => total + booking.total, 0);

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
    <div className="flex min-h-full w-full flex-col bg-canvas pb-14">
      <Navbar role="kasir" />
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Date Navigation Bar */}
      <DateNavigationBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#007AFF] text-white shadow-xs">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Kasir POS & Interactive Grid
                </h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                  Staff Operator
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Input reservasi Booking atau pelanggan Walk-in.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedSlotUnit(units[0] || null);
                setSelectedSlotTime('12:00');
                setIsBookingModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#007AFF] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0066CC]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Booking Manual</span>
            </button>
          </div>
        </div>

        {/* 4 Financial & Operational Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Flame className="h-3.5 w-3.5 text-emerald-600" />
              Sedang Main (Active)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {activeBookings.length}
              </span>
              <span className="text-xs text-slate-500">/ {units.length} Unit</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-[#007AFF]" />
              Terkonfirmasi (Jadwal)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {confirmedBookings.length}
              </span>
              <span className="text-xs text-slate-500">Sesi</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <DollarSign className="h-3.5 w-3.5 text-slate-700" />
              Omzet Hari Ini
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                {formatRupiah(totalOmzetHariIni)}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <CreditCard className="h-3.5 w-3.5 text-amber-600" />
              Belum Dibayar
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-lg font-bold text-amber-700 font-mono">
                {formatRupiah(totalBelumDibayar)}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <StatusLegend />

        {/* Interactive Timeline Grid */}
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="h-7 w-7 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Memuat grid interaktif...</span>
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