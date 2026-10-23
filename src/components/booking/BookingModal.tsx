'use client';

import React, { useMemo, useState } from 'react';
import {
  Unit,
  BookingFormData,
  BookingStatusPembayaran,
  BookingSumber,
  CashierOperator,
  CASHIER_OPERATORS,
} from '@/types/database';
import { formatRupiah, addHoursToTime, formatTimeShort, getOperationalStartHour } from '@/lib/utils';
import { X, Clock, User, Phone, AlertCircle, Check, StickyNote } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  initialUnit?: Unit | null;
  initialTime?: string;
  selectedDate: string;
  onSubmit: (formData: BookingFormData) => Promise<{ success: boolean; error?: string }>;
}

export default function BookingModal({
  isOpen,
  onClose,
  units,
  initialUnit,
  initialTime = '10:00',
  selectedDate,
  onSubmit,
}: BookingModalProps) {
  const [selectedUnitCode, setSelectedUnitCode] = useState(
    initialUnit?.kode_unit || units[0]?.kode_unit || ''
  );
  const [jamMulai, setJamMulai] = useState(initialTime);
  const [durasi, setDurasi] = useState(2);
  const [nama, setNama] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [source, setSource] = useState<BookingSumber>('Booking');
  const [operator, setOperator] = useState<CashierOperator | ''>('');
  const [statusBayar, setStatusBayar] = useState<BookingStatusPembayaran>('Belum Bayar');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUnit = useMemo(
    () => units.find((unit) => unit.kode_unit === selectedUnitCode) || units[0],
    [units, selectedUnitCode]
  );
  const jamSelesai = addHoursToTime(jamMulai, durasi);
  const total = durasi * (currentUnit?.tarif_per_jam || 0);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!nama.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMessage('Nomor WhatsApp pelanggan wajib diisi untuk referensi operator.');
      return;
    }
    if (!operator) {
      setErrorMessage('Operator kasir wajib dipilih.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        kode_unit: selectedUnitCode,
        tanggal_booking: selectedDate,
        jam_mulai: jamMulai,
        durasi_efektif: durasi,
        nama_pelanggan: nama.trim(),
        no_whatsapp: whatsapp.trim(),
        status_pembayaran: statusBayar,
        status_booking: 'Terkonfirmasi',
        sumber_booking: source,
        operator_kasir: operator,
        catatan: catatan.trim() || undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Booking gagal disimpan.');
        return;
      }

      onClose();
      setNama('');
      setWhatsapp('');
      setSource('Booking');
      setOperator('');
      setStatusBayar('Belum Bayar');
      setCatatan('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/20 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/80 bg-white/95 p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Input Booking Kasir</h2>
            <p className="mt-1 text-xs text-slate-500">Catat reservasi pelanggan untuk pembayaran langsung di kasir.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="booking-unit">Unit / Room</label>
              <select id="booking-unit" value={selectedUnitCode} onChange={(event) => setSelectedUnitCode(event.target.value)} className={fieldClass}>
                {units.map((unit) => (
                  <option key={unit.kode_unit} value={unit.kode_unit}>
                    {unit.kode_unit} · {formatRupiah(unit.tarif_per_jam)}/jam
                  </option>
                ))}
              </select>
              <span className="mt-1 block truncate text-[11px] text-slate-500">{currentUnit?.preferensi_zona}</span>
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-time"><Clock className="mr-1 inline h-3.5 w-3.5" />Jam Mulai</label>
              <input id="booking-time" type="time" value={jamMulai} step="1800" onChange={(event) => setJamMulai(event.target.value)} className={`${fieldClass} font-mono`} required />
              <span className="mt-1 block text-[11px] text-slate-500">
                Buka {String(getOperationalStartHour(selectedDate)).padStart(2, '0')}:00–02:00
              </span>
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-duration">Durasi</label>
              <select id="booking-duration" value={durasi} onChange={(event) => setDurasi(Number(event.target.value))} className={fieldClass}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                  <option key={hours} value={hours}>{hours} jam · sampai {formatTimeShort(addHoursToTime(jamMulai, hours))}</option>
                ))}
              </select>
              <span className="mt-1 block font-mono text-[11px] text-slate-500">Selesai {formatTimeShort(jamSelesai)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="booking-name"><User className="mr-1 inline h-3.5 w-3.5" />Nama Pemesan</label>
              <input id="booking-name" type="text" autoComplete="name" value={nama} onChange={(event) => setNama(event.target.value)} placeholder="Nama pelanggan" className={fieldClass} required />
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-whatsapp"><Phone className="mr-1 inline h-3.5 w-3.5" />WhatsApp (referensi operator)</label>
              <input id="booking-whatsapp" type="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="08xxxxxxxxxx" className={`${fieldClass} font-mono`} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="booking-source">Sumber Booking</label>
              <select id="booking-source" value={source} onChange={(event) => setSource(event.target.value as BookingSumber)} className={fieldClass}>
                <option value="Booking">Booking</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-operator">Operator Kasir <span className="text-rose-600">*</span></label>
              <select id="booking-operator" value={operator} onChange={(event) => setOperator(event.target.value as CashierOperator | '')} className={fieldClass} required>
                <option value="">Pilih operator kasir</option>
                {CASHIER_OPERATORS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="booking-payment">Status Pembayaran</label>
              <select id="booking-payment" value={statusBayar} onChange={(event) => setStatusBayar(event.target.value as BookingStatusPembayaran)} className={fieldClass}>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Lunas (Bayar di Kasir)">Lunas (Bayar di Kasir)</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="booking-note"><StickyNote className="mr-1 inline h-3.5 w-3.5" />Catatan Internal (opsional)</label>
              <input id="booking-note" type="text" value={catatan} onChange={(event) => setCatatan(event.target.value)} placeholder="Hanya terlihat oleh operator" className={fieldClass} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
            <div>
              <span className="block text-xs text-slate-600">{currentUnit?.kode_unit} · {durasi} jam × {formatRupiah(currentUnit?.tarif_per_jam || 0)}</span>
              <span className="mt-1 block text-xs text-slate-500">Bayar langsung di kasir</span>
            </div>
            <span className="font-mono text-base font-bold text-blue-950">{formatRupiah(total)}</span>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 rounded-lg bg-[#007AFF] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0066CC] disabled:opacity-50">
              {isSubmitting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
