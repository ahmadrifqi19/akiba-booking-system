'use client';

import React, { useMemo, useState } from 'react';
import { Cabang, Operator } from '@/types/database';
import { AlertCircle, Check, Edit2, Plus, Trash2, Users, X } from 'lucide-react';

interface OperatorManagementTabProps {
  operators: Operator[];
  branches: Cabang[];
  selectedBranchCode: string;
  onBranchChange: (branchCode: string) => void;
  isLoading: boolean;
  onSave: (operatorId: string | null, branchCode: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (operatorId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function OperatorManagementTab({
  operators,
  branches,
  selectedBranchCode,
  onBranchChange,
  isLoading,
  onSave,
  onDelete,
}: OperatorManagementTabProps) {
  const [newName, setNewName] = useState('');
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const branchOperators = useMemo(
    () => operators.filter((operator) => operator.kode_cabang === selectedBranchCode),
    [operators, selectedBranchCode]
  );
  const fieldClass =
    'w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2.5 text-xs text-sky-950 outline-none focus:border-sky-400 focus:bg-white';

  const handleSave = async (operatorId: string | null, name: string) => {
    const normalizedName = name.trim();
    if (!selectedBranchCode || !normalizedName) {
      setFeedback({ type: 'error', text: 'Cabang dan nama operator wajib diisi.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await onSave(operatorId, selectedBranchCode, normalizedName);
      if (!result.success) {
        setFeedback({ type: 'error', text: result.error || 'Gagal menyimpan operator.' });
        return;
      }
      setFeedback({
        type: 'success',
        text: operatorId ? 'Nama operator berhasil diperbarui.' : 'Operator berhasil ditambahkan.',
      });
      setNewName('');
      setEditingOperator(null);
      setEditingName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (operator: Operator) => {
    if (!confirm(`Hapus operator "${operator.nama_operator}" dari cabang ${operator.kode_cabang}?`)) return;
    setFeedback(null);
    const result = await onDelete(operator.id);
    setFeedback(result.success
      ? { type: 'success', text: `Operator "${operator.nama_operator}" berhasil dihapus.` }
      : { type: 'error', text: result.error || 'Gagal menghapus operator.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-4 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-sky-950">Manajemen Operator Kasir</h2>
            <p className="text-xs text-sky-600/80">Kelola nama operator yang tersedia di setiap cabang.</p>
          </div>
        </div>
        <select
          aria-label="Pilih cabang operator"
          value={selectedBranchCode}
          disabled={branches.length === 0}
          onChange={(event) => onBranchChange(event.target.value)}
          className="rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-xs font-semibold text-sky-900 outline-none focus:border-sky-400"
        >
          {branches.map((branch) => (
            <option key={branch.kode_cabang} value={branch.kode_cabang}>
              {branch.kode_cabang} · {branch.nama_cabang}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 rounded-2xl border p-3 text-xs ${
          feedback.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {feedback.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave(null, newName);
        }}
        className="flex flex-col gap-2 rounded-3xl border border-sky-100 bg-white p-4 shadow-[0_8px_30px_-15px_rgba(14,165,233,0.3)] sm:flex-row"
      >
        <label className="sr-only" htmlFor="new-operator-name">Nama operator baru</label>
        <input
          id="new-operator-name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nama operator kasir"
          maxLength={100}
          className={fieldClass}
          required
        />
        <button
          type="submit"
          disabled={isSaving || !selectedBranchCode}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] transition-all hover:bg-sky-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Tambah Operator
        </button>
      </form>

      <div className="space-y-2 rounded-3xl border border-sky-100 bg-white p-4 shadow-[0_8px_30px_-15px_rgba(14,165,233,0.3)]">
        <h3 className="text-sm font-bold text-sky-950">
          Operator {selectedBranchCode ? `· ${selectedBranchCode}` : ''}
        </h3>
        {isLoading ? (
          <p className="py-4 text-center text-xs text-sky-600">Memuat operator dari Supabase...</p>
        ) : branchOperators.length === 0 ? (
          <p className="py-4 text-center text-xs text-sky-600">Belum ada operator untuk cabang ini.</p>
        ) : (
          branchOperators.map((operator) => (
            <div key={operator.id} className="flex flex-col gap-2 rounded-2xl border border-sky-100 bg-sky-50/40 p-3 sm:flex-row sm:items-center">
              {editingOperator?.id === operator.id ? (
                <>
                  <label className="sr-only" htmlFor={`operator-${operator.id}`}>Edit nama operator</label>
                  <input
                    id={`operator-${operator.id}`}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    maxLength={100}
                    className={fieldClass}
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSave(operator.id, editingName)}
                      disabled={isSaving}
                      aria-label="Simpan operator"
                      className="rounded-xl bg-emerald-500 p-2 text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOperator(null)}
                      aria-label="Batal mengedit operator"
                      className="rounded-xl border border-sky-200 bg-white p-2 text-sky-700 hover:bg-sky-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-semibold text-sky-950">{operator.nama_operator}</span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOperator(operator);
                        setEditingName(operator.nama_operator);
                        setFeedback(null);
                      }}
                      aria-label={`Edit ${operator.nama_operator}`}
                      className="rounded-xl border border-sky-200 bg-white p-2 text-sky-700 hover:bg-sky-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(operator)}
                      aria-label={`Hapus ${operator.nama_operator}`}
                      className="rounded-xl border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
