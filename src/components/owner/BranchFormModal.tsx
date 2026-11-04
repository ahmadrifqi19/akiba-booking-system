'use client';

import React, { useState, useEffect } from 'react';
import { Cabang } from '@/types/database';
import { X, Building2, Check, AlertCircle } from 'lucide-react';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchToEdit?: Cabang | null;
  onSave: (branch: Cabang, isEdit: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function BranchFormModal({
  isOpen,
  onClose,
  branchToEdit,
  onSave,
}: BranchFormModalProps) {
  const isEdit = Boolean(branchToEdit);
  const [kodeCabang, setKodeCabang] = useState('');
  const [namaCabang, setNamaCabang] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [jamBukaWeekday, setJamBukaWeekday] = useState('10:00');
  const [jamBukaWeekend, setJamBukaWeekend] = useState('09:00');
  const [jamTutup, setJamTutup] = useState('02:00');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (branchToEdit) {
      setKodeCabang(branchToEdit.kode_cabang);
      setNamaCabang(branchToEdit.nama_cabang);
      setAlamat(branchToEdit.alamat || '');
      setTelepon(branchToEdit.no_telepon || '');
      setJamBukaWeekday(branchToEdit.jam_buka_weekday || '10:00');
      setJamBukaWeekend(branchToEdit.jam_buka_weekend || '09:00');
      setJamTutup(branchToEdit.jam_tutup || '02:00');
      setIsActive(branchToEdit.is_active ?? true);
    } else {
      setKodeCabang('');
      setNamaCabang('');
      setAlamat('');
      setTelepon('');
      setJamBukaWeekday('10:00');
      setJamBukaWeekend('09:00');
      setJamTutup('02:00');
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [branchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalKode = kodeCabang.trim().toUpperCase();
    if (!finalKode) {
      setErrorMsg('Kode cabang tidak boleh kosong.');
      return;
    }
    if (!namaCabang.trim()) {
      setErrorMsg('Nama cabang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave(
        {
          kode_cabang: finalKode,
          nama_cabang: namaCabang.trim(),
          alamat: alamat.trim() || undefined,
          no_telepon: telepon.trim() || undefined,
          jam_buka_weekday: jamBukaWeekday,
          jam_buka_weekend: jamBukaWeekend,
          jam_tutup: jamTutup,
          is_active: isActive,
        },
        isEdit
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan data cabang.');
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
        <div className="flex items-center justify-between border-b border-sky-100 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_6px_16px_-4px_rgba(14,165,233,0.7)]">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-sky-950">
                {isEdit ? `Edit Cabang: ${branchToEdit?.kode_cabang}` : 'Tambah Cabang Baru'}
              </h2>
              <p className="text-xs text-sky-600/80">
                Kelola profil cabang, alamat, dan konfigurasi jam operasional.
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
              <label className={labelClass} htmlFor="kode-cabang-input">
                Kode Cabang <span className="text-rose-500">*</span>
              </label>
              <input
                id="kode-cabang-input"
                type="text"
                value={kodeCabang}
                onChange={(e) => setKodeCabang(e.target.value.toUpperCase())}
                placeholder="Misal: CBG-02"
                disabled={isEdit}
                className={`${fieldClass} font-mono uppercase ${isEdit ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="nama-cabang-input">
                Nama Cabang <span className="text-rose-500">*</span>
              </label>
              <input
                id="nama-cabang-input"
                type="text"
                value={namaCabang}
                onChange={(e) => setNamaCabang(e.target.value)}
                placeholder="Misal: Akiba Core Cabang 2"
                className={fieldClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="alamat-cabang">
              Alamat Lengkap
            </label>
            <textarea
              id="alamat-cabang"
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat fisik cabang..."
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="telepon-cabang">
              Kontak / WhatsApp Cabang
            </label>
            <input
              id="telepon-cabang"
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className={`${fieldClass} font-mono`}
            />
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 space-y-2">
            <span className="block text-xs font-semibold text-sky-950">Jam Operasional Cabang</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-sky-700">Buka Weekday</label>
                <input
                  type="time"
                  value={jamBukaWeekday}
                  onChange={(e) => setJamBukaWeekday(e.target.value)}
                  className={`${fieldClass} py-1.5 font-mono text-center`}
                />
              </div>
              <div>
                <label className="text-[10px] text-sky-700">Buka Weekend</label>
                <input
                  type="time"
                  value={jamBukaWeekend}
                  onChange={(e) => setJamBukaWeekend(e.target.value)}
                  className={`${fieldClass} py-1.5 font-mono text-center`}
                />
              </div>
              <div>
                <label className="text-[10px] text-sky-700">Tutup (Malam)</label>
                <input
                  type="time"
                  value={jamTutup}
                  onChange={(e) => setJamTutup(e.target.value)}
                  className={`${fieldClass} py-1.5 font-mono text-center`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div>
              <span className="block text-xs font-semibold text-sky-950">Status Operasi Cabang</span>
              <span className="text-[11px] text-sky-600/80">Cabang aktif dapat dipilih untuk transaksi unit.</span>
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
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Cabang' : 'Tambah Cabang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

