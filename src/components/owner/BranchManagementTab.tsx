'use client';

import React from 'react';
import { Cabang, Unit } from '@/types/database';
import {
  Building2,
  Plus,
  Edit2,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  Copy,
  Check,
} from 'lucide-react';

interface BranchManagementTabProps {
  branches: Cabang[];
  units: Unit[];
  isLoading: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (branch: Cabang) => void;
  onToggleStatus: (branch: Cabang) => Promise<void>;
}

export default function BranchManagementTab({
  branches,
  units,
  isLoading,
  onOpenAddModal,
  onOpenEditModal,
  onToggleStatus,
}: BranchManagementTabProps) {
  const [copiedSql, setCopiedSql] = React.useState(false);

  const getUnitCountForBranch = (branchCode: string) => {
    return units.filter((u) => (u.kode_cabang || 'CBG-01') === branchCode).length;
  };

  const copySqlSnippet = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.cabang (
    kode_cabang TEXT PRIMARY KEY,
    nama_cabang TEXT NOT NULL,
    alamat TEXT,
    no_telepon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    jam_buka_weekday TIME NOT NULL DEFAULT '10:00',
    jam_buka_weekend TIME NOT NULL DEFAULT '09:00',
    jam_tutup TIME NOT NULL DEFAULT '02:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;
    void navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-sky-950">Manajemen Cabang Rental</h2>
            <p className="text-xs text-sky-600/80">
              Kelola daftar cabang usaha, alamat outlet, dan sinkronisasi unit rental.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] transition-all hover:bg-sky-600 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Cabang Baru</span>
        </button>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {branches.map((b) => {
          const unitCount = getUnitCountForBranch(b.kode_cabang);
          const isActive = b.is_active !== false;

          return (
            <div
              key={b.kode_cabang}
              className={`flex flex-col justify-between rounded-3xl border p-5 transition-all ${
                isActive
                  ? 'border-sky-100 bg-white shadow-[0_12px_40px_-20px_rgba(14,165,233,0.3)] hover:border-sky-300'
                  : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-mono text-xs font-bold border border-sky-200">
                      {b.kode_cabang}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-sky-950">{b.nama_cabang}</h3>
                      <span className="text-[11px] font-mono text-sky-600">ID: {b.kode_cabang}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void onToggleStatus(b)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                        isActive
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Ubah status cabang"
                    >
                      {isActive ? (
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

                    <button
                      type="button"
                      onClick={() => onOpenEditModal(b)}
                      className="rounded-xl border border-sky-100 bg-white p-1.5 text-sky-600 shadow-2xs hover:bg-sky-50 hover:text-sky-900 active:scale-95"
                      title="Edit profil cabang"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-sky-900">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <span className="text-sky-800/90">{b.alamat || 'Alamat belum diatur'}</span>
                  </div>

                  {b.no_telepon && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-sky-700">{b.no_telepon}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="text-sky-700">
                      Buka: {b.jam_buka_weekday || '10:00'} (Weekday) · {b.jam_buka_weekend || '09:00'} (Weekend) - {b.jam_tutup || '02:00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-sky-100 pt-3">
                <span className="text-[11px] text-sky-600/80">Alokasi Unit Terpasang:</span>
                <span className="rounded-full bg-sky-100 px-3 py-1 font-mono text-xs font-bold text-sky-900">
                  {unitCount} Unit Rental
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

