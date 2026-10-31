'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Booking, BookingSchedule, Unit } from '@/types/database';
import {
  formatRupiah,
  formatTimeShort,
  getOperationalBookingStart,
  getOperationalStartHour,
} from '@/lib/utils';
import { checkMemberEligibility } from '@/lib/memberEligibility';
import { supabase } from '@/lib/client';
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
  Award,
  AlertCircle,
  Edit3,
  Save,
} from 'lucide-react';

interface BookingDetailModalProps {
  booking: Booking | BookingSchedule | null;
  isOpen: boolean;
  onClose: () => void;
  isKasirMode?: boolean;
  units?: Unit[];
  onUpdateStatus?: (
    bookingId: string,
    status: Booking['status_booking'],
    statusBayar?: Booking['status_pembayaran']
  ) => Promise<{ success: boolean; error?: string }>;
  onBookingUpdated?: () => void;
}

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  isKasirMode = false,
  units = [],
  onUpdateStatus,
  onBookingUpdated,
}: BookingDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTanggal, setEditTanggal] = useState('');
  const [editJamMulai, setEditJamMulai] = useState('');
  const [editDurasi, setEditDurasi] = useState(1);
  const [editKodeUnit, setEditKodeUnit] = useState('');

  const [fetchedUnits, setFetchedUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (isOpen && (!units || units.length === 0) && fetchedUnits.length === 0) {
      void supabase
        .from('units')
        .select('*')
        .then(({ data, error }) => {
          if (!error && data) {
            setFetchedUnits(data as Unit[]);
          }
        });
    }
  }, [isOpen, units, fetchedUnits.length]);

  const activeUnits = units && units.length > 0 ? units : fetchedUnits;
  const availableUnits = activeUnits.length > 0
    ? activeUnits
    : (booking?.kode_unit ? [{ kode_unit: booking.kode_unit, kelas: 'Standard' } as Unit] : []);

  const currentUnit = booking ? availableUnits.find((u) => u.kode_unit === booking.kode_unit) : undefined;
  const memberEligibility = useMemo(() => {
    if (!booking) return null;
    return checkMemberEligibility(booking.durasi_efektif, currentUnit, booking.kode_unit);
  }, [booking, currentUnit]);

  if (!isOpen || !booking || !memberEligibility) return null;

  const handleStartEdit = async () => {
    setEditTanggal(booking.tanggal_booking || '');
    setEditJamMulai(booking.jam_mulai || '10:00');
    setEditDurasi(booking.durasi_efektif || 1);
    setEditKodeUnit(booking.kode_unit || '');
    setIsEditing(true);
    setErrorMessage(null);

    if (!units || units.length === 0) {
      try {
        const { data, error } = await supabase.from('units').select('*');
        if (!error && data) {
          setFetchedUnits(data as Unit[]);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar unit:', err);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const startOp = getOperationalBookingStart(editJamMulai, editTanggal);
      const endOp = startOp + editDurasi * 60;
      const openOp = getOperationalStartHour(editTanggal) * 60;

      if (startOp < openOp || endOp > 26 * 60) {
        const openStr = `${String(Math.floor(openOp / 60)).padStart(2, '0')}:00`;
        throw new Error(`Jadwal harus berada dalam jam operasional (${openStr}–02:00).`);
      }

      const [hourStr, minStr] = editJamMulai.split(':');
      const startMinutes = parseInt(hourStr) * 60 + parseInt(minStr);
      const endMinutes = startMinutes + editDurasi * 60;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMin = endMinutes % 60;
      const editJamSelesai = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      const targetUnit = availableUnits.find((u) => u.kode_unit === editKodeUnit);
      const editEligibility = checkMemberEligibility(editDurasi, targetUnit, editKodeUnit);

      const { error } = await supabase
        .from('bookings')
        .update({
          tanggal_booking: editTanggal,
          jam_mulai: editJamMulai,
          jam_selesai: editJamSelesai,
          durasi_efektif: editDurasi,
          kode_unit: editKodeUnit,
          catatan: editEligibility.statusText,
        })
        .eq('id', booking.id);

      if (error) throw error;

      setIsEditing(false);

      if (onBookingUpdated) {
        onBookingUpdated();
      }

      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memperbarui jadwal booking.');
    } finally {
      setIsUpdating(false);
    }
  };

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
      if (onBookingUpdated) {
        onBookingUpdated();
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui booking.');
    } finally {
      setIsUpdating(false);
    }
  };

  const overlayClass =
    'fixed inset-0 z-50 flex items-center justify-center bg-sky-950/25 p-3 backdrop-blur-sm sm:p-4';
  const panelClass =
    'relative w-full rounded-3xl border border-white bg-linear-to-b from-sky-50 to-white p-5 text-sky-950 shadow-[0_24px_70px_-20px_rgba(14,165,233,0.5)]';
  const closeBtnClass =
    'shrink-0 rounded-full border border-sky-100 bg-white p-2 text-sky-500 shadow-[0_4px_12px_-6px_rgba(14,165,233,0.5)] transition-all hover:bg-sky-50 hover:text-sky-700 active:scale-90';
  const editFieldClass =
    'w-full rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-xs font-medium text-sky-950 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20';
  const editLabelClass = 'mb-1 block font-semibold text-sky-800';

  if (!isKasirMode) {
    return (
      <div className={overlayClass}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Jadwal Unit ${booking.kode_unit}`}
          className={`${panelClass} max-w-sm`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail jadwal"
            className={`absolute right-4 top-4 ${closeBtnClass}`}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_6px_16px_-4px_rgba(14,165,233,0.7)]">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-sky-600">Kode unit</p>
              <h2 className="text-xl font-bold tracking-tight text-sky-950">{booking.kode_unit}</h2>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="rounded-2xl border border-sky-100 bg-white/80 p-3.5">
              <p className="text-xs font-medium text-sky-600">Nama Pemesan</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-sky-950">
                <User className="h-4 w-4 text-sky-500" />
                {booking.nama_pelanggan}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/80 p-3.5">
              <p className="text-xs font-medium text-sky-600">Interval Jam Main</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-sky-950">
                <Clock className="h-4 w-4 text-sky-500" />
                {formatTimeShort(booking.jam_mulai)} - {formatTimeShort(booking.jam_selesai)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!('no_whatsapp' in booking)) return null;

  const waClean = booking.no_whatsapp.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waClean.startsWith('0') ? `62${waClean.substring(1)}` : waClean}`;

  return (
    <div className={overlayClass}>
      <div role="dialog" aria-modal="true" className={`${panelClass} max-h-[92vh] max-w-lg overflow-y-auto`}>
        <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_6px_16px_-4px_rgba(14,165,233,0.7)]">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-sky-950">Unit {booking.kode_unit}</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${booking.status_booking === 'Active'
                  ? 'border-emerald-200 bg-linear-to-br from-emerald-100 to-teal-50 text-emerald-950'
                  : booking.status_booking === 'Selesai'
                    ? 'border-slate-200 bg-linear-to-br from-slate-100 to-slate-50 text-slate-600'
                    : 'border-sky-200 bg-linear-to-br from-sky-100 to-sky-50 text-sky-950'
                  }`}>
                  {booking.status_booking}
                </span>
              </div>
              <p className="text-xs text-sky-600/80">{booking.tanggal_booking}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => void handleStartEdit()}
                className="flex items-center gap-1 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-600 shadow-[0_4px_12px_-6px_rgba(14,165,233,0.5)] transition-all hover:bg-sky-50 hover:text-sky-800 active:scale-95"
              >
                <Edit3 className="h-3.5 w-3.5" /> Ubah Jadwal
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Tutup detail booking" className={closeBtnClass}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-4 py-4 text-xs">
            <div className="space-y-3 rounded-2xl border border-sky-200 bg-linear-to-br from-sky-100/70 to-sky-50/60 p-4">
              <h3 className="text-sm font-bold text-sky-950">Form Ubah Jadwal &amp; Unit</h3>

              <div>
                <label className={editLabelClass}>Tanggal Booking</label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className={editFieldClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={editLabelClass}>Jam Mulai</label>
                  <input
                    type="time"
                    value={editJamMulai}
                    onChange={(e) => setEditJamMulai(e.target.value)}
                    className={`${editFieldClass} font-mono`}
                    required
                  />
                </div>
                <div>
                  <label className={editLabelClass}>Durasi (Jam)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editDurasi}
                    onChange={(e) => setEditDurasi(Number(e.target.value))}
                    className={`${editFieldClass} font-mono`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={editLabelClass}>Pindah Unit / Room</label>
                <select
                  value={editKodeUnit}
                  onChange={(e) => setEditKodeUnit(e.target.value)}
                  className={editFieldClass}
                  required
                >
                  {availableUnits.map((u) => (
                    <option key={u.kode_unit} value={u.kode_unit}>
                      {u.kode_unit} {u.kelas ? `(${u.kelas})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-sky-100 bg-white px-5 py-2.5 font-semibold text-sky-700 transition-all hover:bg-sky-50 active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-2.5 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(14,165,233,0.8)] transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> Simpan Perubahan
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-3.5 py-4 text-xs">
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 sm:grid-cols-2">
                <div>
                  <span className="mb-0.5 block text-[11px] text-sky-600">Pelanggan</span>
                  <div className="flex items-center gap-1.5 font-semibold text-sky-950">
                    <User className="h-3.5 w-3.5 text-sky-500" />{booking.nama_pelanggan}
                  </div>
                </div>
                <div>
                  <span className="mb-0.5 block text-[11px] text-sky-600">WhatsApp</span>
                  <a href={waUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono font-medium text-sky-600 hover:text-sky-800 hover:underline">
                    <Phone className="h-3.5 w-3.5" />{booking.no_whatsapp}<ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <div>
                  <span className="mb-0.5 block text-[11px] text-sky-600">Waktu Sewa</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-sky-950">
                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                    {formatTimeShort(booking.jam_mulai)} - {formatTimeShort(booking.jam_selesai)} ({booking.durasi_efektif} jam)
                  </div>
                </div>
                <div>
                  <span className="mb-0.5 block text-[11px] text-sky-600">Sumber Booking</span>
                  <span className="font-medium text-sky-900">{booking.sumber_booking}</span>
                </div>
                {'operator_kasir' in booking && (
                  <div>
                    <span className="mb-0.5 block text-[11px] text-sky-600">Operator Kasir</span>
                    <span className="font-medium text-sky-900">{booking.operator_kasir || 'Belum tercatat'}</span>
                  </div>
                )}
              </div>

              <div
                className={`rounded-2xl border p-3.5 transition-all ${
                  memberEligibility.isEligible
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                    : 'border-amber-200 bg-amber-50/70 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      memberEligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    Reminder Syarat Member ({memberEligibility.category})
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      memberEligibility.isEligible
                        ? 'border border-emerald-300 bg-white text-emerald-800'
                        : 'border border-amber-300 bg-white text-amber-800'
                    }`}
                  >
                    Min. {memberEligibility.minHours} Jam
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 font-semibold">
                  {memberEligibility.isEligible ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span className="text-xs">
                    {memberEligibility.statusText}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-sky-900/80">
                  {memberEligibility.description}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-linear-to-br from-sky-100 to-sky-50 p-4 shadow-[0_8px_20px_-12px_rgba(14,165,233,0.6)]">
                <div>
                  <span className="block text-[11px] text-sky-700">Biaya Sewa · {booking.durasi_efektif} jam</span>
                  <span className="mt-1 block font-mono text-lg font-bold text-sky-950">{formatRupiah(booking.total)}</span>
                </div>
              </div>
            </div>

            {errorMessage && <p role="alert" className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}

            {onUpdateStatus && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 pt-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  {booking.status_booking === 'Terkonfirmasi' && (
                    <button type="button" onClick={() => void handleStatusChange('Active')} disabled={isUpdating} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.8)] transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50">
                      <Play className="h-3.5 w-3.5 fill-current" />Mulai Main
                    </button>
                  )}
                  {booking.status_booking === 'Active' && (
                    <button type="button" onClick={() => void handleStatusChange('Selesai')} disabled={isUpdating} className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(14,165,233,0.8)] transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" />Selesaikan Sesi
                    </button>
                  )}
                </div>
                {booking.status_booking !== 'Batal' && (
                  <button type="button" onClick={() => {
                    if (confirm('Yakin ingin membatalkan booking ini?')) void handleStatusChange('Batal');
                  }} disabled={isUpdating} className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-rose-600 transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50">
                    <XCircle className="h-3.5 w-3.5" />Batalkan
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}