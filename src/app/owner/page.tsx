'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/client';
import { Unit, Cabang, Operator } from '@/types/database';
import Navbar from '@/components/layout/Navbar';
import UnitManagementTab from '@/components/owner/UnitManagementTab';
import PricingOperationalTab from '@/components/owner/PricingOperationalTab';
import ZoneManagementTab from '@/components/owner/ZoneManagementTab';
import BranchManagementTab from '@/components/owner/BranchManagementTab';
import UnitFormModal from '@/components/owner/UnitFormModal';
import BranchFormModal from '@/components/owner/BranchFormModal';
import OperatorManagementTab from '@/components/owner/OperatorManagementTab';
import {
  Gamepad2,
  Coins,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function OwnerMasterPage() {
  const queryClient = useQueryClient();
  const isConfigured = isSupabaseConfigured();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'units' | 'pricing' | 'zones' | 'branches' | 'operators'>('units');
  const [selectedBranchCode, setSelectedBranchCode] = useState('CBG-01');

  // Modals state
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Cabang | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // 1. Fetch All Units (including inactive)
  const unitsQuery = useQuery<Unit[]>({
    queryKey: ['owner_units'],
    queryFn: async () => {
      if (!isConfigured) {
        throw new Error('Supabase belum dikonfigurasi. Data unit tidak dapat dimuat.');
      }
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('urutan', { ascending: true });

      if (error) {
        throw new Error(`Gagal memuat master units: ${error.message}`);
      }
      return (data ?? []) as Unit[];
    },
    enabled: isConfigured,
    staleTime: 1000 * 30,
  });

  // 2. Fetch Branches
  const branchesQuery = useQuery<Cabang[]>({
    queryKey: ['owner_branches'],
    queryFn: async () => {
      if (!isConfigured) {
        throw new Error('Supabase belum dikonfigurasi. Data cabang tidak dapat dimuat.');
      }
      const { data, error } = await supabase
        .from('cabang')
        .select('*')
        .order('kode_cabang', { ascending: true });

      if (error) {
        throw new Error(`Gagal memuat master cabang: ${error.message}`);
      }
      return (data ?? []) as Cabang[];
    },
    enabled: isConfigured,
    staleTime: 1000 * 60,
  });

  const operatorsQuery = useQuery<Operator[]>({
    queryKey: ['owner_operators'],
    queryFn: async () => {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi. Data operator tidak dapat dimuat.');
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('nama_operator', { ascending: true });
      if (error) throw new Error(`Gagal memuat master operator: ${error.message}`);
      return data ?? [];
    },
    enabled: isConfigured,
    staleTime: 1000 * 30,
  });

  // Real-time subscription to units table
  useEffect(() => {
    if (!isConfigured) return;

    const channel = supabase
      .channel('owner:master-data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['owner_units'] });
          void queryClient.invalidateQueries({ queryKey: ['units'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cabang' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['owner_branches'] });
          void queryClient.invalidateQueries({ queryKey: ['branches'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'operators' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['owner_operators'] });
          void queryClient.invalidateQueries({ queryKey: ['operators'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isConfigured, queryClient]);

  const units: Unit[] = unitsQuery.data ?? [];
  const branches: Cabang[] = branchesQuery.data ?? [];
  const operators: Operator[] = operatorsQuery.data ?? [];
  const activeBranchCode = branches.some((branch) => branch.kode_cabang === selectedBranchCode)
    ? selectedBranchCode
    : branches[0]?.kode_cabang ?? '';
  const activeBranch = branches.find((branch) => branch.kode_cabang === activeBranchCode);
  const branchUnits = units.filter((unit) => unit.kode_cabang === activeBranchCode);

  const handleSaveOperator = async (
    operatorId: string | null,
    branchCode: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');
      const query = operatorId
        ? supabase.from('operators').update({ nama_operator: name, kode_cabang: branchCode }).eq('id', operatorId)
        : supabase.from('operators').insert({ nama_operator: name, kode_cabang: branchCode });
      const { error } = await query;
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['owner_operators'] });
      await queryClient.invalidateQueries({ queryKey: ['operators'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menyimpan operator.' };
    }
  };

  const handleDeleteOperator = async (operatorId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');
      const { error } = await supabase.from('operators').delete().eq('id', operatorId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['owner_operators'] });
      await queryClient.invalidateQueries({ queryKey: ['operators'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus operator.' };
    }
  };

  // =========================================================================
  // HANDLERS FOR UNITS CRUD
  // =========================================================================
  const handleOpenAddUnit = () => {
    setUnitToEdit(null);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: Unit) => {
    setUnitToEdit(unit);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (
    unitData: Partial<Unit>,
    isEdit: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      if (isEdit) {
        const { error } = await supabase
          .from('units')
          .update({
            kelas: unitData.kelas,
            preferensi_zona: unitData.preferensi_zona,
            tarif_per_jam: unitData.tarif_per_jam,
            kode_cabang: unitData.kode_cabang,
            urutan: unitData.urutan,
            is_active: unitData.is_active,
          })
          .eq('kode_unit', unitData.kode_unit!);

        if (error) throw error;
        showToast(`Unit ${unitData.kode_unit} berhasil diperbarui.`);
      } else {
        const { error } = await supabase.from('units').insert({
          kode_unit: unitData.kode_unit!,
          kode_cabang: unitData.kode_cabang || 'CBG-01',
          kelas: unitData.kelas!,
          preferensi_zona: unitData.preferensi_zona!,
          tarif_per_jam: unitData.tarif_per_jam!,
          urutan: unitData.urutan ?? 1,
          is_active: unitData.is_active ?? true,
        });

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Unit dengan kode "${unitData.kode_unit}" sudah ada.`);
          }
          throw error;
        }
        showToast(`Unit baru ${unitData.kode_unit} berhasil ditambahkan!`);
      }

      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan unit.';
      return { success: false, error: msg };
    }
  };

  const handleToggleUnitStatus = async (unit: Unit) => {
    const newStatus = unit.is_active === false ? true : false;
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('units')
        .update({ is_active: newStatus })
        .eq('kode_unit', unit.kode_unit);

      if (error) throw error;

      showToast(`Status unit ${unit.kode_unit} diubah menjadi ${newStatus ? 'Aktif' : 'Non-aktif'}.`);
      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status unit.', 'error');
    }
  };

  const handleDeleteUnit = async (kodeUnit: string) => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase.from('units').delete().eq('kode_unit', kodeUnit);

      if (error) {
        if (error.code === '23503') {
          throw new Error(`Unit "${kodeUnit}" memiliki riwayat transaksi/booking. Tidak dapat dihapus permanen. Silakan nonaktifkan unit ini.`);
        }
        throw error;
      }

      showToast(`Unit ${kodeUnit} berhasil dihapus.`);
      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus unit.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS FOR PRICING & OPERATIONAL
  // =========================================================================
  const handleUpdateClassRate = async (
    className: string,
    newRate: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('units')
        .update({ tarif_per_jam: newRate })
        .eq('kelas', className)
        .eq('kode_cabang', activeBranchCode);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal update tarif kelas.' };
    }
  };

  const handleUpdateOperationalHours = async (
    branchCode: string,
    weekdayOpen: string,
    weekendOpen: string,
    closeTime: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('cabang')
        .update({
          jam_buka_weekday: weekdayOpen,
          jam_buka_weekend: weekendOpen,
          jam_tutup: closeTime,
        })
        .eq('kode_cabang', branchCode);

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['owner_branches'] });
      await queryClient.invalidateQueries({ queryKey: ['branches'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menyimpan jam operasional.' };
    }
  };

  // =========================================================================
  // HANDLERS FOR ZONES
  // =========================================================================
  const handleUpdateZoneName = async (
    oldZone: string,
    newZone: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('units')
        .update({ preferensi_zona: newZone })
        .eq('preferensi_zona', oldZone)
        .eq('kode_cabang', activeBranchCode);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal memperbarui zona unit.' };
    }
  };

  const handleAssignUnitZone = async (
    kodeUnit: string,
    newZone: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('units')
        .update({ preferensi_zona: newZone })
        .eq('kode_unit', kodeUnit);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['owner_units'] });
      await queryClient.invalidateQueries({ queryKey: ['units'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menetapkan zona.' };
    }
  };

  // =========================================================================
  // HANDLERS FOR BRANCHES
  // =========================================================================
  const handleOpenAddBranch = () => {
    setBranchToEdit(null);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: Cabang) => {
    setBranchToEdit(b);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (
    branchData: Cabang,
    isEdit: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      if (isEdit) {
        const { error } = await supabase
          .from('cabang')
          .update(branchData)
          .eq('kode_cabang', branchData.kode_cabang);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('cabang').insert(branchData);
        if (error) throw error;
      }

      showToast(`Cabang ${branchData.nama_cabang} berhasil disimpan.`);
      await queryClient.invalidateQueries({ queryKey: ['owner_branches'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menyimpan cabang.' };
    }
  };

  const handleToggleBranchStatus = async (branch: Cabang) => {
    const newStatus = branch.is_active === false ? true : false;
    try {
      if (!isConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { error } = await supabase
        .from('cabang')
        .update({ is_active: newStatus })
        .eq('kode_cabang', branch.kode_cabang);

      if (error) throw error;
      showToast(`Cabang ${branch.nama_cabang} kini ${newStatus ? 'Aktif' : 'Non-aktif'}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status cabang.', 'error');
    }
    await queryClient.invalidateQueries({ queryKey: ['owner_branches'] });
    await queryClient.invalidateQueries({ queryKey: ['branches'] });
  };

  // Quick stats
  const totalUnits = branchUnits.length;
  const activeUnitsCount = branchUnits.filter((u) => u.is_active !== false).length;
  const totalBranches = branches.length;
  const averageRate = totalUnits > 0
    ? Math.round(branchUnits.reduce((acc, u) => acc + (u.tarif_per_jam || 0), 0) / totalUnits)
    : 0;
  const dataError = !isConfigured
    ? 'Supabase belum dikonfigurasi. Data master tidak dapat dimuat.'
    : unitsQuery.error?.message ?? branchesQuery.error?.message ?? operatorsQuery.error?.message;

  return (
    <div className="flex min-h-full w-full flex-col bg-linear-to-b from-sky-50/40 to-white pb-14">
      {/* Navbar with Owner Role */}
      <Navbar role="owner" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-[0_10px_30px_-10px_rgba(14,165,233,0.5)] border animate-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-sky-950 border-sky-800'
              : 'bg-rose-950 border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {dataError && (
        <div role="alert" className="mx-auto mt-4 w-full max-w-7xl px-3 sm:px-6">
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{dataError}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pt-5 space-y-5">
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/90 via-white to-sky-50/60 p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_6px_16px_-4px_rgba(14,165,233,0.7)]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-sky-950">
                  Master Data Management
                </h1>
                <span className="rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-sky-600" /> Owner Panel
                </span>
              </div>
              <p className="mt-0.5 text-xs text-sky-600/80">
                Kelola Cabang, Unit/Konsol, Ruangan &amp; Zona, Jam Operasional, serta Kebijakan Tarif secara mandiri.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-white/90 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-sky-600 uppercase">Total Unit</span>
              <span className="font-mono text-base font-bold text-sky-950">{totalUnits}</span>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-emerald-700 uppercase">Unit Aktif</span>
              <span className="font-mono text-base font-bold text-emerald-950">{activeUnitsCount}</span>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/90 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-sky-600 uppercase">Cabang</span>
              <span className="font-mono text-base font-bold text-sky-950">{totalBranches}</span>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/90 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-sky-600 uppercase">Rata Tarif</span>
              <span className="font-mono text-xs font-bold text-sky-950">{averageRate > 0 ? `${Math.round(averageRate / 1000)}k` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex overflow-x-auto rounded-2xl border border-sky-200 bg-sky-100/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('units')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'units'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-800 hover:text-sky-950 hover:bg-white/70'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Manajemen Unit &amp; Konsol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'pricing'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-800 hover:text-sky-950 hover:bg-white/70'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>Tarif &amp; Jam Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'zones'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-800 hover:text-sky-950 hover:bg-white/70'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Ruangan &amp; Zona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'branches'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-800 hover:text-sky-950 hover:bg-white/70'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Manajemen Cabang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'operators'
                ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                : 'text-sky-800 hover:text-sky-950 hover:bg-white/70'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Manajemen Operator</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="pt-1">
          {['units', 'pricing', 'zones'].includes(activeTab) && (
            <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-sky-100 bg-white p-3 shadow-2xs sm:flex-row sm:items-center">
              <label htmlFor="owner-active-branch" className="text-xs font-bold text-sky-800">
                Cabang yang dikelola
              </label>
              <select
                id="owner-active-branch"
                value={activeBranchCode}
                onChange={(event) => setSelectedBranchCode(event.target.value)}
                disabled={branches.length === 0}
                className="rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs font-semibold text-sky-950 outline-none focus:border-sky-400 sm:min-w-64"
              >
                {branches.map((branch) => (
                  <option key={branch.kode_cabang} value={branch.kode_cabang}>
                    {branch.kode_cabang} · {branch.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'units' && (
            <UnitManagementTab
              units={branchUnits}
              branches={branches}
              isLoading={unitsQuery.isLoading}
              onRefresh={() => void unitsQuery.refetch()}
              onOpenAddModal={handleOpenAddUnit}
              onOpenEditModal={handleOpenEditUnit}
              onToggleStatus={handleToggleUnitStatus}
              onDeleteUnit={handleDeleteUnit}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingOperationalTab
              key={activeBranchCode}
              units={branchUnits}
              branches={activeBranch ? [activeBranch] : []}
              onUpdateClassRate={handleUpdateClassRate}
              onUpdateOperationalHours={handleUpdateOperationalHours}
            />
          )}

          {activeTab === 'zones' && (
            <ZoneManagementTab
              units={branchUnits}
              onUpdateZoneName={handleUpdateZoneName}
              onAssignUnitZone={handleAssignUnitZone}
            />
          )}

          {activeTab === 'branches' && (
            <BranchManagementTab
              branches={branches}
              units={units}
              isLoading={branchesQuery.isLoading}
              onOpenAddModal={handleOpenAddBranch}
              onOpenEditModal={handleOpenEditBranch}
              onToggleStatus={handleToggleBranchStatus}
            />
          )}

          {activeTab === 'operators' && (
            <OperatorManagementTab
              operators={operators}
              branches={branches}
              selectedBranchCode={activeBranchCode}
              onBranchChange={setSelectedBranchCode}
              isLoading={operatorsQuery.isLoading}
              onSave={handleSaveOperator}
              onDelete={handleDeleteOperator}
            />
          )}
        </div>
      </div>

      {/* Unit Form Modal */}
      <UnitFormModal
        key={`${isUnitModalOpen ? 'open' : 'closed'}-${unitToEdit?.kode_unit ?? activeBranchCode}`}
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        unitToEdit={unitToEdit}
        branches={branches}
        defaultBranchCode={activeBranchCode}
        onSave={handleSaveUnit}
      />

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branchToEdit={branchToEdit}
        onSave={handleSaveBranch}
      />
    </div>
  );
}
