'use client';

import React, { useState, useMemo } from 'react';
import { Unit } from '@/types/database';
import {
  Layers,
  Plus,
  Edit2,
  Check,
  AlertCircle,
  Gamepad2,
  Sparkles,
  MapPin,
  Flame,
  Wind,
} from 'lucide-react';

interface ZoneManagementTabProps {
  units: Unit[];
  onUpdateZoneName: (oldZone: string, newZone: string) => Promise<{ success: boolean; error?: string }>;
  onAssignUnitZone: (kodeUnit: string, newZone: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ZoneManagementTab({
  units,
  onUpdateZoneName,
  onAssignUnitZone,
}: ZoneManagementTabProps) {
  // Aggregate zones
  const zoneSummary = useMemo(() => {
    const map = new Map<string, Unit[]>();
    units.forEach((u) => {
      const z = u.preferensi_zona || 'Tanpa Zona';
      if (!map.has(z)) {
        map.set(z, []);
      }
      map.get(z)!.push(u);
    });
    return Array.from(map.entries()).map(([zoneName, unitList]) => {
      const isSmoking = zoneName.toUpperCase().includes('SMOKING') && !zoneName.toUpperCase().includes('NON');
      const floorMatch = zoneName.match(/Lt\s*(\d+)/i);
      const floor = floorMatch ? `Lantai ${floorMatch[1]}` : 'Lantai Utama';

      return {
        zoneName,
        isSmoking,
        floor,
        units: unitList,
        count: unitList.length,
      };
    });
  }, [units]);

  // Modal / Inline Edit state
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Zone creation state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addLantai, setAddLantai] = useState('Lt 2');
  const [addTipe, setAddTipe] = useState<'Smoking' | 'Non Smoking'>('Smoking');
  const [addDeskripsi, setAddDeskripsi] = useState('');

  const handleStartEdit = (oldName: string) => {
    setEditingZone(oldName);
    setNewZoneName(oldName);
    setFeedbackMsg(null);
  };

  const handleSaveEdit = async () => {
    if (!editingZone || !newZoneName.trim() || newZoneName === editingZone) {
      setEditingZone(null);
      return;
    }

    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      const res = await onUpdateZoneName(editingZone, newZoneName.trim());
      if (!res.success) {
        setFeedbackMsg({ type: 'error', text: res.error || 'Gagal mengubah nama zona.' });
        return;
      }
      setFeedbackMsg({
        type: 'success',
        text: `Zona "${editingZone}" berhasil diubah menjadi "${newZoneName.trim()}" untuk seluruh unit terkait!`,
      });
      setEditingZone(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateZoneTemplate = () => {
    const generatedName = `${addTipe} | ${addLantai}`;
    setFeedbackMsg({
      type: 'success',
      text: `Zona template "${generatedName}" siap digunakan. Anda dapat menetapkan unit ke zona ini pada formulir Edit Unit.`,
    });
    setIsAddingNew(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-sky-950">Manajemen Ruangan &amp; Zona</h2>
            <p className="text-xs text-sky-600/80">
              Kelola zona Smoking / Non-Smoking, pembagian lantai, dan alokasi unit.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] transition-all hover:bg-sky-600 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{isAddingNew ? 'Tutup Formulir' : 'Buat Zona Baru'}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 rounded-2xl border p-3 text-xs ${
            feedbackMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* New Zone Form */}
      {isAddingNew && (
        <div className="rounded-3xl border border-sky-200 bg-white p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] space-y-3">
          <h3 className="text-sm font-bold text-sky-950">Tambah Zona / Ruangan Baru</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">Tipe Area</label>
              <select
                value={addTipe}
                onChange={(e) => setAddTipe(e.target.value as 'Smoking' | 'Non Smoking')}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
              >
                <option value="Smoking">Smoking Area (Bebas Merokok)</option>
                <option value="Non Smoking">Non-Smoking Area (Bebas Asap)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">Lantai Ruangan</label>
              <select
                value={addLantai}
                onChange={(e) => setAddLantai(e.target.value)}
                className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white"
              >
                <option value="Lt 1">Lantai 1</option>
                <option value="Lt 2">Lantai 2</option>
                <option value="Lt 3">Lantai 3</option>
                <option value="Lt 4">Lantai 4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-sky-800 mb-1">Preview Format Zona</label>
              <div className="rounded-xl border border-sky-200 bg-sky-100/50 px-3 py-2 font-mono text-xs font-bold text-sky-950">
                {addTipe} | {addLantai}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateZoneTemplate}
              className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-sky-600 active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Format Zona</span>
            </button>
          </div>
        </div>
      )}

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {zoneSummary.map((zone) => {
          const isEditing = editingZone === zone.zoneName;

          return (
            <div
              key={zone.zoneName}
              className="flex flex-col justify-between rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.3)] transition-all hover:border-sky-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                        zone.isSmoking
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {zone.isSmoking ? (
                        <Flame className="h-4 w-4" />
                      ) : (
                        <Wind className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            className="rounded-xl border border-sky-300 bg-sky-50/50 px-2.5 py-1 text-xs font-bold text-sky-950 focus:bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="rounded-lg bg-emerald-500 p-1 text-white hover:bg-emerald-600"
                            title="Simpan"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingZone(null)}
                            className="rounded-lg bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                            title="Batal"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-sm text-sky-950">{zone.zoneName}</h3>
                      )}
                      <span className="text-[11px] text-sky-600/80">{zone.floor}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                      {zone.count} Unit
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(zone.zoneName)}
                        className="rounded-xl border border-sky-100 bg-white p-1 text-sky-600 shadow-2xs hover:bg-sky-50 hover:text-sky-900"
                        title="Ubah nama zona"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Unit chips in this zone */}
                <div className="mt-4">
                  <span className="block text-[10px] font-semibold text-sky-700 mb-1.5">
                    Unit Terpasang di Zona Ini:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.units.map((u) => (
                      <span
                        key={u.kode_unit}
                        className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                          u.is_active === false
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-sky-50 text-sky-900 border border-sky-200'
                        }`}
                      >
                        {u.kode_unit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-sky-100 pt-3 flex items-center justify-between text-[11px] text-sky-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                  Filter Zona Kasir
                </span>
                <span className="font-bold text-sky-800">
                  {zone.isSmoking ? 'Smoking Friendly' : 'Air Conditioned Non-Smoking'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

