'use client';

import React, { useState, useMemo } from 'react';
import { Unit, Cabang } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  Gamepad2,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface UnitManagementTabProps {
  units: Unit[];
  branches: Cabang[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (unit: Unit) => void;
  onToggleStatus: (unit: Unit) => Promise<void>;
  onDeleteUnit: (kodeUnit: string) => Promise<void>;
}

export default function UnitManagementTab({
  units,
  branches,
  isLoading,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onToggleStatus,
  onDeleteUnit,
}: UnitManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.kode_unit.toLowerCase().includes(q) ||
        u.kelas.toLowerCase().includes(q) ||
        u.preferensi_zona.toLowerCase().includes(q) ||
        (u.kode_cabang && u.kode_cabang.toLowerCase().includes(q));

      // Class Filter
      let matchClass = true;
      if (selectedClassFilter === 'VVIP') {
        matchClass = u.kelas.toUpperCase().includes('VVIP') || u.kode_unit.toUpperCase().startsWith('VVIP');
      } else if (selectedClassFilter === 'VIP') {
        matchClass =
          (u.kelas.toUpperCase().includes('VIP') && !u.kelas.toUpperCase().includes('VVIP')) ||
          (u.kode_unit.toUpperCase().startsWith('VIP') && !u.kode_unit.toUpperCase().startsWith('VVIP'));
      } else if (selectedClassFilter === 'REGULER') {
        matchClass =
          u.kelas.toUpperCase().includes('REGULER') ||
          u.kode_unit.toUpperCase().startsWith('REG') ||
          u.kode_unit.toUpperCase().startsWith('PS3');
      }

      // Status Filter
      let matchStatus = true;
      if (selectedStatusFilter === 'ACTIVE') {
        matchStatus = u.is_active !== false;
      } else if (selectedStatusFilter === 'INACTIVE') {
        matchStatus = u.is_active === false;
      }

      return matchSearch && matchClass && matchStatus;
    });
  }, [units, searchQuery, selectedClassFilter, selectedStatusFilter]);

  const activeCount = units.filter((u) => u.is_active !== false).length;
  const inactiveCount = units.filter((u) => u.is_active === false).length;

  const handleDeleteClick = async (unit: Unit) => {
    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus unit "${unit.kode_unit}"?\n\nPerhatian: Jika unit memiliki riwayat booking, lebih disarankan untuk menonaktifkan status unit daripada menghapusnya.`
    );
    if (!confirmed) return;

    setIsDeleting(unit.kode_unit);
    try {
      await onDeleteUnit(unit.kode_unit);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar & Stats */}
      <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-sky-950">Daftar Unit &amp; Konsol</h2>
            <p className="text-xs text-sky-600/80">
              Total {units.length} Unit · {activeCount} Aktif · {inactiveCount} Non-aktif
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] transition-all hover:bg-sky-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Unit Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-sky-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode unit, kelas, atau zona..."
            className="w-full rounded-xl border border-sky-100 bg-sky-50/40 py-2 pl-9 pr-3 text-xs text-sky-950 placeholder:text-sky-300 focus:border-sky-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Class Filter */}
          <div className="flex rounded-xl border border-sky-200 bg-sky-50/70 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedClassFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedClassFilter === 'ALL'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-950'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedClassFilter('VVIP')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedClassFilter === 'VVIP'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-950'
              }`}
            >
              VVIP
            </button>
            <button
              type="button"
              onClick={() => setSelectedClassFilter('VIP')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedClassFilter === 'VIP'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-950'
              }`}
            >
              VIP
            </button>
            <button
              type="button"
              onClick={() => setSelectedClassFilter('REGULER')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedClassFilter === 'REGULER'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-950'
              }`}
            >
              Reguler
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex rounded-xl border border-sky-200 bg-sky-50/70 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-sky-700 hover:text-sky-950'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ACTIVE')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedStatusFilter === 'ACTIVE'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-950'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('INACTIVE')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedStatusFilter === 'INACTIVE'
                  ? 'bg-slate-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Non-aktif
            </button>
          </div>
        </div>
      </div>

      {/* Units Table / Grid */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2.5 rounded-3xl border border-sky-100 bg-white">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-200 border-t-sky-500" />
          <span className="text-xs text-sky-600 font-medium">Memuat master data unit...</span>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-sky-200 bg-sky-50/30 p-6 text-center">
          <Gamepad2 className="h-10 w-10 text-sky-300" />
          <p className="mt-2 text-sm font-bold text-sky-900">Tidak ada unit yang sesuai filter</p>
          <p className="text-xs text-sky-600/70">
            Coba ubah kata kunci pencarian atau bersihkan filter di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-sky-950">
              <thead className="border-b border-sky-100 bg-sky-50/80 text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Unit</th>
                  <th scope="col" className="px-4 py-3">Kelas &amp; Syarat Member</th>
                  <th scope="col" className="px-4 py-3">Zona / Ruangan</th>
                  <th scope="col" className="px-4 py-3">Tarif / Jam</th>
                  <th scope="col" className="px-3 py-3 text-center">Urutan</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70">
                {filteredUnits.map((unit) => {
                  const isVipOrVvip =
                    unit.kelas.toUpperCase().includes('VIP') ||
                    unit.kode_unit.toUpperCase().startsWith('VIP') ||
                    unit.kode_unit.toUpperCase().startsWith('VVIP');
                  const memberHours = isVipOrVvip ? 2 : 3;

                  return (
                    <tr
                      key={unit.kode_unit}
                      className={`transition-colors hover:bg-sky-50/50 ${
                        unit.is_active === false ? 'bg-slate-50/60 opacity-70' : ''
                      }`}
                    >
                      {/* Kode Unit */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                              unit.is_active === false
                                ? 'bg-slate-200 text-slate-700'
                                : isVipOrVvip
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-sky-100 text-sky-900 border border-sky-200'
                            }`}
                          >
                            {unit.kode_unit.slice(0, 3)}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-sky-950">
                              {unit.kode_unit}
                            </span>
                            <span className="block text-[10px] text-sky-600/70">
                              {unit.kode_cabang || 'CBG-01'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kelas Konsol & Member Hint */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isVipOrVvip
                                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                                : 'border border-sky-200 bg-sky-50 text-sky-800'
                            }`}
                          >
                            {unit.kelas}
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                            <Award className="h-2.5 w-2.5 text-emerald-600" />
                            Member: Min. {memberHours} Jam
                          </span>
                        </div>
                      </td>

                      {/* Zona */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-lg bg-sky-50/80 px-2 py-1 text-[11px] font-medium text-sky-800 border border-sky-100">
                          {unit.preferensi_zona}
                        </span>
                      </td>

                      {/* Tarif */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-sky-950">
                        {formatRupiah(unit.tarif_per_jam)}
                      </td>

                      {/* Urutan */}
                      <td className="px-3 py-3.5 text-center font-mono text-xs text-sky-700">
                        #{unit.urutan ?? 0}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => void onToggleStatus(unit)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                            unit.is_active !== false
                              ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title="Klik untuk ubah status aktif unit"
                        >
                          {unit.is_active !== false ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-slate-500" />
                              <span>Non-aktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(unit)}
                            className="rounded-xl border border-sky-200 bg-white p-1.5 text-sky-700 shadow-2xs hover:bg-sky-50 hover:text-sky-900 active:scale-95"
                            title="Edit data unit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteClick(unit)}
                            disabled={isDeleting === unit.kode_unit}
                            className="rounded-xl border border-rose-200 bg-white p-1.5 text-rose-600 shadow-2xs hover:bg-rose-50 hover:text-rose-800 active:scale-95 disabled:opacity-50"
                            title="Hapus unit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

