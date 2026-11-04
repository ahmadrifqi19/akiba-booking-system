'use client';

import React, { useState, useMemo } from 'react';
import { Unit, Cabang } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import {
  Coins,
  Clock,
  Check,
  AlertCircle,
  Award,
  Info,
} from 'lucide-react';

interface PricingOperationalTabProps {
  units: Unit[];
  branches: Cabang[];
  onUpdateClassRate: (className: string, newRate: number) => Promise<{ success: boolean; error?: string }>;
  onUpdateOperationalHours: (
    branchCode: string,
    weekdayOpen: string,
    weekendOpen: string,
    closeTime: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function PricingOperationalTab({
  units,
  branches,
  onUpdateClassRate,
  onUpdateOperationalHours,
}: PricingOperationalTabProps) {
  // 1. Group units by class
  const classSummary = useMemo(() => {
    const map = new Map<string, { count: number; currentRate: number; units: Unit[] }>();
    units.forEach((u) => {
      const cls = u.kelas || 'Standard';
      if (!map.has(cls)) {
        map.set(cls, { count: 0, currentRate: u.tarif_per_jam, units: [] });
      }
      const item = map.get(cls)!;
      item.count += 1;
      item.units.push(u);
    });
    return Array.from(map.entries()).map(([className, data]) => ({
      className,
      count: data.count,
      currentRate: data.currentRate,
      units: data.units,
    }));
  }, [units]);

  // Pricing edit state per class
  const [ratesInput, setRatesInput] = useState<Record<string, number>>({});
  const [updatingClass, setUpdatingClass] = useState<string | null>(null);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [pricingErrorMsg, setPricingErrorMsg] = useState<string | null>(null);

  // Operational hours state
  const [selectedBranchCodeState, setSelectedBranchCode] = useState(branches[0]?.kode_cabang ?? '');
  const selectedBranchCode = selectedBranchCodeState || branches[0]?.kode_cabang || '';
  const selectedBranch = branches.find((branch) => branch.kode_cabang === selectedBranchCode);
  const [hoursByBranch, setHoursByBranch] = useState<
    Record<string, { weekdayOpen: string; weekendOpen: string; closeTime: string }>
  >({});
  const selectedHours = hoursByBranch[selectedBranchCode] ?? {
    weekdayOpen: selectedBranch?.jam_buka_weekday || '10:00',
    weekendOpen: selectedBranch?.jam_buka_weekend || '09:00',
    closeTime: selectedBranch?.jam_tutup || '02:00',
  };
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSuccessMsg, setHoursSuccessMsg] = useState<string | null>(null);
  const [hoursErrorMsg, setHoursErrorMsg] = useState<string | null>(null);

  const handleRateInputChange = (cls: string, val: number) => {
    setRatesInput((prev) => ({ ...prev, [cls]: val }));
  };

  const handleSaveClassRate = async (cls: string) => {
    const newRate = ratesInput[cls];
    if (!newRate || newRate <= 0) {
      setPricingErrorMsg(`Tarif untuk kelas ${cls} harus lebih dari 0.`);
      return;
    }

    setUpdatingClass(cls);
    setPricingErrorMsg(null);
    setPricingSuccessMsg(null);
    try {
      const res = await onUpdateClassRate(cls, newRate);
      if (!res.success) {
        setPricingErrorMsg(res.error || `Gagal memperbarui tarif untuk kelas ${cls}`);
        return;
      }
      setPricingSuccessMsg(`Tarif untuk seluruh unit kelas "${cls}" berhasil diperbarui menjadi ${formatRupiah(newRate)}/jam!`);
      setTimeout(() => setPricingSuccessMsg(null), 4000);
    } catch (err) {
      setPricingErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setUpdatingClass(null);
    }
  };

  const handleSaveOperationalHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHours(true);
    setHoursErrorMsg(null);
    setHoursSuccessMsg(null);

    try {
      const res = await onUpdateOperationalHours(
        selectedBranchCode,
        selectedHours.weekdayOpen,
        selectedHours.weekendOpen,
        selectedHours.closeTime
      );
      if (!res.success) {
        setHoursErrorMsg(res.error || 'Gagal menyimpan jam operasional.');
        return;
      }
      setHoursSuccessMsg(`Konfigurasi jam operasional untuk cabang ${selectedBranchCode} berhasil disimpan!`);
      setTimeout(() => setHoursSuccessMsg(null), 4000);
    } catch (err) {
      setHoursErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsSavingHours(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bagian 1: Pengaturan Tarif per Kelas */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-sky-950">Kebijakan Tarif Rental per Kelas</h2>
              <p className="text-xs text-sky-600/80">
                Ubah tarif sekaligus untuk semua unit dalam satu kategori kelas konsol.
              </p>
            </div>
          </div>
        </div>

        {pricingSuccessMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{pricingSuccessMsg}</span>
          </div>
        )}

        {pricingErrorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{pricingErrorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classSummary.map((item) => {
            const isVip =
              item.className.toUpperCase().includes('VIP') ||
              item.className.toUpperCase().includes('VVIP');
            const memberMin = isVip ? 2 : 3;
            const currentVal = ratesInput[item.className] ?? item.currentRate;

            return (
              <div
                key={item.className}
                className="flex flex-col justify-between rounded-3xl border border-sky-100 bg-white p-4 shadow-[0_8px_30px_-15px_rgba(14,165,233,0.3)] transition-all hover:border-sky-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isVip
                          ? 'border border-amber-300 bg-amber-50 text-amber-900'
                          : 'border border-sky-300 bg-sky-50 text-sky-900'
                      }`}
                    >
                      {item.className}
                    </span>
                    <span className="rounded-full bg-sky-100/70 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                      {item.count} Unit Terpasang
                    </span>
                  </div>

                  {/* Member rule notice */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                    <Award className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Syarat Member: Min. {memberMin} Jam Rental</span>
                  </div>

                  <div className="mt-3">
                    <span className="block text-[10px] font-semibold text-sky-600">
                      Tarif Saat Ini:
                    </span>
                    <span className="font-mono text-base font-bold text-sky-950">
                      {formatRupiah(item.currentRate)} / jam
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-sky-100 pt-3">
                  <label className="block text-[10px] font-semibold text-sky-800 mb-1">
                    Atur Tarif Baru (Rp):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={currentVal}
                      onChange={(e) => handleRateInputChange(item.className, Number(e.target.value))}
                      className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-1.5 font-mono text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveClassRate(item.className)}
                      disabled={updatingClass === item.className || currentVal === item.currentRate}
                      className="shrink-0 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-600 active:scale-95 disabled:opacity-40"
                    >
                      {updatingClass === item.className ? '...' : 'Terapkan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 2: Pengaturan Jam Operasional */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-sky-950">Pengaturan Jam Operasional Rental</h2>
              <p className="text-xs text-sky-600/80">
                Atur jadwal buka kasir untuk hari kerja (Weekday) dan akhir pekan (Weekend).
              </p>
            </div>
          </div>
        </div>

        {hoursSuccessMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{hoursSuccessMsg}</span>
          </div>
        )}

        {hoursErrorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{hoursErrorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSaveOperationalHours}
          className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">
                Pilih Cabang
              </label>
              <select
                value={selectedBranchCode}
                onChange={(e) => setSelectedBranchCode(e.target.value)}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3.5 py-2.5 text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
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

            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">
                Jam Buka Weekday (Senin - Jumat)
              </label>
              <input
                type="time"
                value={selectedHours.weekdayOpen}
                onChange={(e) => setHoursByBranch((current) => ({
                  ...current,
                  [selectedBranchCode]: { ...selectedHours, weekdayOpen: e.target.value },
                }))}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3.5 py-2.5 font-mono text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
                required
              />
              <span className="mt-1 block text-[10px] text-sky-600/70">
                Default: 10:00 WIB
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">
                Jam Buka Weekend (Sabtu - Minggu)
              </label>
              <input
                type="time"
                value={selectedHours.weekendOpen}
                onChange={(e) => setHoursByBranch((current) => ({
                  ...current,
                  [selectedBranchCode]: { ...selectedHours, weekendOpen: e.target.value },
                }))}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3.5 py-2.5 font-mono text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
                required
              />
              <span className="mt-1 block text-[10px] text-sky-600/70">
                Default: 09:00 WIB
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">
                Jam Tutup Operasional
              </label>
              <input
                type="time"
                value={selectedHours.closeTime}
                onChange={(e) => setHoursByBranch((current) => ({
                  ...current,
                  [selectedBranchCode]: { ...selectedHours, closeTime: e.target.value },
                }))}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3.5 py-2.5 font-mono text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
                required
              />
              <span className="mt-1 block text-[10px] text-sky-600/70">
                Default: 02:00 (Dini hari)
              </span>
            </div>

            <div className="sm:col-span-2 flex items-center rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
              <Info className="h-5 w-5 text-sky-500 shrink-0 mr-2.5" />
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Jam operasional ini mengontrol pembukaan slot waktu interaktif pada kalender Kasir POS, validasi konflik jadwal rental, dan display matriks jadwal mingguan.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingHours}
              className="flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] hover:bg-sky-600 active:scale-95 disabled:opacity-50"
            >
              {isSavingHours ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{isSavingHours ? 'Menyimpan...' : 'Simpan Jam Operasional'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
