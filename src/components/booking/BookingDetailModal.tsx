'use client';

import React, { useState } from 'react';
import { Booking, BookingSchedule } from '@/types/database';
import { formatRupiah, formatTimeShort } from '@/lib/utils';
import {
  X,
  User,
  Phone,
  Clock,
  Gamepad2,
  Play,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CreditCard,
  StickyNote,
} from 'lucide-react';

interface BookingDetailModalProps {
  booking: Booking | BookingSchedule | null;
  isOpen: boolean;
  onClose: () => void;
  isKasirMode?: boolean;
  onUpdateStatus?: (
    bookingId: string,
    status: Booking['status_booking'],
    statusBayar?: Booking['status_pembayaran']
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  isKasirMode = false,
  onUpdateStatus,
}: BookingDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleStatusChange = async (
    newStatus: Booking['status_booking'],
    statusBayar?: Booking['status_pembayaran']
  ) => {
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const result = await onUpdateStatus(booking.id, newStatus, statusBayar);
      if (!result.success) {
        setErrorMessage(result.error || 'Perubahan booking gagal disimpan.');
        return;
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui booking.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isKasirMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-3 backdrop-blur-sm sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Jadwal Unit ${booking.kode_unit}`}
          className="relative w-full max-w-sm rounded-2xl border border-white/80 bg-white/95 p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail jadwal"
            className="absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kode Unit</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{booking.kode_unit}</h2>
          <p className="mt-4 text-xs font-medium text-slate-500">Nama Pemesan</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <User className="h-4 w-4 text-slate-500" />
            {booking.nama_pelanggan}
          </p>
          <p className="mt-4 text-xs font-medium text-slate-500">Interval Jam Main</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-slate-500" />
            {formatTimeShort(booking.jam_mulai)} - {formatTimeShort(booking.jam_selesai)}
          </p>
        </div>
      </div>
    );
  }

  if (!('no_whatsapp' in booking)) return null;

  const waClean = booking.no_whatsapp.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waClean.startsWith('0') ? `62${waClean.substring(1)}` : waClean}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-3 backdrop-blur-sm sm:p-4">
      <div role="dialog" aria-modal="true" className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/80 bg-white/95 p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#007AFF]">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Unit {booking.kode_unit}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  booking.status_booking === 'Active'
                    ? 'border-emerald-300 bg-emerald-100/90 text-emerald-950'
                    : booking.status_booking === 'Selesai'
                      ? 'border-slate-300 bg-slate-200/80 text-slate-700'
                      : 'border-blue-200 bg-blue-100/90 text-blue-950'
                }`}>
                  {booking.status_booking}
                </span>
              </div>
              <p className="text-xs text-slate-500">{booking.tanggal_booking}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup detail booking" className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5 py-4 text-xs">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 sm:grid-cols-2">
            <div>
              <span className="mb-0.5 block text-[11px] text-slate-500">Pelanggan</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <User className="h-3.5 w-3.5 text-slate-500" />{booking.nama_pelanggan}
              </div>
            </div>
            <div>
              <span className="mb-0.5 block text-[11px] text-slate-500">WhatsApp</span>
              <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono font-medium text-[#007AFF] hover:underline">
                <Phone className="h-3.5 w-3.5" />{booking.no_whatsapp}<ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <div>
              <span className="mb-0.5 block text-[11px] text-slate-500">Waktu Sewa</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {formatTimeShort(booking.jam_mulai)} - {formatTimeShort(booking.jam_selesai)} ({booking.durasi_efektif} jam)
              </div>
            </div>
            <div>
              <span className="mb-0.5 block text-[11px] text-slate-500">Sumber Booking</span>
              <span className="font-medium text-slate-800">{booking.sumber_booking}</span>
            </div>
            {'operator_kasir' in booking && (
              <div>
                <span className="mb-0.5 block text-[11px] text-slate-500">Operator Kasir</span>
                <span className="font-medium text-slate-800">{booking.operator_kasir || 'Belum tercatat'}</span>
              </div>
            )}
          </div>

          {booking.catatan && (
            <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3">
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500"><StickyNote className="h-3 w-3" />Catatan Internal</span>
              <p className="mt-1 font-medium text-slate-800">{booking.catatan}</p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5">
            <div>
              <span className="block text-[11px] text-slate-500">Biaya Sewa · {booking.durasi_efektif} jam</span>
              <span className="mt-1 block font-mono text-lg font-bold text-slate-900">{formatRupiah(booking.total)}</span>
            </div>
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              booking.status_pembayaran === 'Lunas (Bayar di Kasir)'
                ? 'border-emerald-300 bg-emerald-100/90 text-emerald-950'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}>
              {booking.status_pembayaran}
            </span>
          </div>
        </div>

        {errorMessage && <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{errorMessage}</p>}

        {onUpdateStatus && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {booking.status_booking === 'Terkonfirmasi' && (
                <button type="button" onClick={() => handleStatusChange('Active')} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-50">
                  <Play className="h-3.5 w-3.5 fill-current" />Mulai Main
                </button>
              )}
              {booking.status_booking === 'Active' && (
                <button type="button" onClick={() => handleStatusChange('Selesai')} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-[#007AFF] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#0066CC] disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" />Selesaikan Sesi
                </button>
              )}
              {booking.status_pembayaran !== 'Lunas (Bayar di Kasir)' && (
                <button type="button" onClick={() => handleStatusChange(booking.status_booking, 'Lunas (Bayar di Kasir)')} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-[#007AFF] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#0066CC] disabled:opacity-50">
                  <CreditCard className="h-3.5 w-3.5" />Lunas (Bayar di Kasir)
                </button>
              )}
            </div>
            {booking.status_booking !== 'Batal' && (
              <button type="button" onClick={() => {
                if (confirm('Yakin ingin membatalkan booking ini?')) void handleStatusChange('Batal');
              }} disabled={isUpdating} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50">
                <XCircle className="h-3.5 w-3.5" />Batalkan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
