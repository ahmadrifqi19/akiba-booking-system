'use client';

import React, { useState } from 'react';
import { Unit, Cabang } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { X, Gamepad2, Check, AlertCircle, Sparkles } from 'lucide-react';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitToEdit?: Unit | null;
  branches: Cabang[];
  defaultBranchCode?: string;
  onSave: (unit: Partial<Unit>, isEdit: boolean) => Promise<{ success: boolean; error?: string }>;
}

const PRESET_CLASSES = [
  'VVIP PS5',
  'VIP PS5',
  'VIP PS4',
  'Reguler PS4',
  'Reguler PS3',
];

const PRESET_ZONES = [
  'Non Smoking | Lt 1',
  'Smoking | Lt 2',
  'Non Smoking | Lt 3',
  'Smoking | Lt 3',
];

export default function UnitFormModal({
  isOpen,
  onClose,
  unitToEdit,
  branches,
  defaultBranchCode,
  onSave,
}: UnitFormModalProps) {
  const isEdit = Boolean(unitToEdit);
  const [kodeUnit, setKodeUnit] = useState(unitToEdit?.kode_unit ?? '');
  const [kodeCabang, setKodeCabang] = useState(
    unitToEdit?.kode_cabang || defaultBranchCode || branches[0]?.kode_cabang || 'CBG-01'
  );
  const [kelas, setKelas] = useState(
    unitToEdit && !PRESET_CLASSES.includes(unitToEdit.kelas) ? 'custom' : unitToEdit?.kelas ?? 'VVIP PS5'
  );
  const [zona, setZona] = useState(
    unitToEdit && !PRESET_ZONES.includes(unitToEdit.preferensi_zona) ? 'custom' : unitToEdit?.preferensi_zona ?? 'Smoking | Lt 2'
  );
  const [tarif, setTarif] = useState(unitToEdit?.tarif_per_jam ?? 35000);
  const [urutan, setUrutan] = useState(unitToEdit?.urutan ?? 1);
  const [isActive, setIsActive] = useState(unitToEdit?.is_active ?? true);
  const [customKelas, setCustomKelas] = useState(
    unitToEdit && !PRESET_CLASSES.includes(unitToEdit.kelas) ? unitToEdit.kelas : ''
  );
  const [customZona, setCustomZona] = useState(
    unitToEdit && !PRESET_ZONES.includes(unitToEdit.preferensi_zona) ? unitToEdit.preferensi_zona : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Otomatis sesuaikan tarif default saat kelas berubah (jika menambah baru)
  const handleKelasChange = (val: string) => {
    setKelas(val);
    if (!isEdit) {
      if (val === 'VVIP PS5') setTarif(35000);
      else if (val === 'VIP PS5') setTarif(30000);
      else if (val === 'VIP PS4') setTarif(25000);
      else if (val === 'Reguler PS4') setTarif(10000);
      else if (val === 'Reguler PS3') setTarif(6000);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalKode = kodeUnit.trim().toUpperCase();
    if (!finalKode) {
      setErrorMsg('Kode unit tidak boleh kosong.');
      return;
    }

    const finalKelas = kelas === 'custom' ? customKelas.trim() : kelas;
    if (!finalKelas) {
      setErrorMsg('Kelas konsol wajib diisi.');
      return;
    }

    const finalZona = zona === 'custom' ? customZona.trim() : zona;
    if (!finalZona) {
      setErrorMsg('Preferensi zona/ruangan wajib diisi.');
      return;
    }

    if (tarif <= 0) {
      setErrorMsg('Tarif per jam harus lebih besar dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave(
        {
          kode_unit: finalKode,
          kode_cabang: kodeCabang,
          kelas: finalKelas,
          preferensi_zona: finalZona,
          tarif_per_jam: Number(tarif),
          urutan: Number(urutan),
          is_active: isActive,
        },
        isEdit
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan data unit.');
        return;
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-2.5 text-xs text-sky-950 outline-none transition placeholder:text-sky-300 hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/20';
  const labelClass = 'mb-1 block text-xs font-semibold text-sky-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-sky-950/25 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white bg-linear-to-b from-sky-50 to-white p-5 text-sky-950 shadow-[0_24px_70px_-20px_rgba(14,165,233,0.5)] sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_6px_16px_-4px_rgba(14,165,233,0.7)]">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-sky-950">
                {isEdit ? `Edit Unit: ${unitToEdit?.kode_unit}` : 'Tambah Unit Konsol Baru'}
              </h2>
              <p className="text-xs text-sky-600/80">
                {isEdit ? 'Perbarui informasi dan spesifikasi unit rental.' : 'Daftarkan unit rental baru ke dalam sistem.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-100 bg-white p-2 text-sky-500 shadow-2xs hover:bg-sky-50 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="kode-unit">
                Kode Unit <span className="text-rose-500">*</span>
              </label>
              <input
                id="kode-unit"
                type="text"
                value={kodeUnit}
                onChange={(e) => setKodeUnit(e.target.value.toUpperCase())}
                placeholder="Misal: VVIP5-03, REG-11"
                disabled={isEdit}
                className={`${fieldClass} font-mono uppercase ${isEdit ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                required
              />
              <span className="mt-0.5 block text-[10px] text-sky-600/70">
                {isEdit ? 'Kode unit unik tidak dapat diubah' : 'Awalan VIP/VVIP atau REG/PS3'}
              </span>
            </div>

            <div>
              <label className={labelClass} htmlFor="kode-cabang">
                Cabang Penempatan
              </label>
              <select
                id="kode-cabang"
                value={kodeCabang}
                onChange={(e) => setKodeCabang(e.target.value)}
                className={fieldClass}
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.kode_cabang} value={b.kode_cabang}>
                      {b.kode_cabang} · {b.nama_cabang}
                    </option>
                  ))
                ) : (
                  <option value="CBG-01">CBG-01 · Akiba Core Pusat</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="kelas-konsol">
                Kelas Konsol <span className="text-rose-500">*</span>
              </label>
              <select
                id="kelas-konsol"
                value={kelas}
                onChange={(e) => handleKelasChange(e.target.value)}
                className={fieldClass}
              >
                {PRESET_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="custom">-- Kustom / Lainnya --</option>
              </select>
              {kelas === 'custom' && (
                <input
                  type="text"
                  placeholder="Ketik kelas kustom..."
                  value={customKelas}
                  onChange={(e) => setCustomKelas(e.target.value)}
                  className={`${fieldClass} mt-1.5`}
                  required
                />
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="zona-ruangan">
                Zona &amp; Lantai <span className="text-rose-500">*</span>
              </label>
              <select
                id="zona-ruangan"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className={fieldClass}
              >
                {PRESET_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
                <option value="custom">-- Kustom Zona Lainnya --</option>
              </select>
              {zona === 'custom' && (
                <input
                  type="text"
                  placeholder="Misal: Non Smoking | Lt 4"
                  value={customZona}
                  onChange={(e) => setCustomZona(e.target.value)}
                  className={`${fieldClass} mt-1.5`}
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="tarif-jam">
                Tarif Rental per Jam (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="tarif-jam"
                type="number"
                min="1000"
                step="500"
                value={tarif}
                onChange={(e) => setTarif(Number(e.target.value))}
                className={`${fieldClass} font-mono`}
                required
              />
              <span className="mt-0.5 block text-[10px] text-sky-600 font-semibold">
                {formatRupiah(tarif)}/jam
              </span>
            </div>

            <div>
              <label className={labelClass} htmlFor="urutan-grid">
                Urutan Tampilan Grid
              </label>
              <input
                id="urutan-grid"
                type="number"
                min="0"
                value={urutan}
                onChange={(e) => setUrutan(Number(e.target.value))}
                className={`${fieldClass} font-mono`}
              />
              <span className="mt-0.5 block text-[10px] text-sky-600/70">
                Semakin kecil, semakin atas di Timeline
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div>
              <span className="block text-xs font-semibold text-sky-950">Status Unit</span>
              <span className="text-[11px] text-sky-600/80">
                Unit aktif akan dapat di-booking oleh kasir dan tampil di jadwal.
              </span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-100/60 to-white p-3.5 shadow-xs">
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase text-sky-700">
              <Sparkles className="h-3 w-3 text-sky-500" /> Preview Tampilan Kasir
            </span>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-sky-950">
                  {kodeUnit || 'KODE-01'}
                </span>
                <span className="ml-2 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                  {kelas === 'custom' ? (customKelas || 'Custom') : kelas}
                </span>
                <p className="mt-0.5 text-[11px] text-sky-600/80">
                  {zona === 'custom' ? (customZona || 'Zona') : zona}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-sky-900">
                  {formatRupiah(tarif)}
                </span>
                <span className="block text-[10px] text-sky-500">per jam</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-sky-100 pt-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] hover:bg-sky-600 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
