'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBookingData } from '@/hooks/useBookingData';
import Navbar from '@/components/layout/Navbar';
import { getTodayDateString } from '@/lib/utils';
import { INITIAL_UNITS, getInitialBookings } from '@/lib/mockData';
import {
  Clock,
  Download,
  Users,
  Calendar as CalendarIcon,
  BarChart3,
  XCircle,
  Filter,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const [todayStr] = useState<string>(getTodayDateString);
  const [rangeType, setRangeType] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // State baru untuk filter status booking
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const { bookings, isLoading } = useBookingData(todayStr, { allDates: true });

  // Filter Data berdasarkan Rentang Tanggal, Sumber Booking, dan Status Booking
  const filteredBookings = useMemo(() => {
    const baseList = (bookings.length > 0 ? bookings : getInitialBookings()).filter(
      (b) => b.sumber_booking === 'Booking'
    );

    // Filter berdasarkan rentang tanggal terlebih dahulu
    const dateFiltered = baseList.filter((b) => {
      const bDate = b.tanggal_booking; // Format: 'YYYY-MM-DD'
      if (!bDate) return false;

      if (rangeType === 'all') return true;
      if (rangeType === 'today') {
        return bDate === todayStr;
      }
      if (rangeType === 'custom') {
        if (!startDate || !endDate) return true;
        const [minDate, maxDate] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
        return bDate >= minDate && bDate <= maxDate;
      }

      const currentDateObj = new Date(todayStr + 'T00:00:00');
      if (rangeType === 'week') {
        currentDateObj.setDate(currentDateObj.getDate() - 6);
      } else if (rangeType === 'month') {
        currentDateObj.setDate(1);
      }

      const yyyy = currentDateObj.getFullYear();
      const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDateObj.getDate()).padStart(2, '0');
      const cutoffStr = `${yyyy}-${mm}-${dd}`;

      return bDate >= cutoffStr && bDate <= todayStr;
    });

    // Filter tambahan berdasarkan dropdown Status Booking
    if (statusFilter === 'all') return dateFiltered;
    return dateFiltered.filter((b) => b.status_booking === statusFilter);
  }, [bookings, rangeType, startDate, endDate, todayStr, statusFilter]);

  // Metric: Total Jam Terjual
  const totalJamTerjual = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status_booking !== 'Batal')
      .reduce((sum, b) => sum + (Number(b.durasi_efektif) || 0), 0);
  }, [filteredBookings]);

  // Metric: Total Transaksi Valid
  const totalTransaksi = useMemo(() => {
    return filteredBookings.filter((b) => b.status_booking !== 'Batal').length;
  }, [filteredBookings]);

  // Metric: Total Booking Dibatalkan
  const totalDibatalkan = useMemo(() => {
    return filteredBookings.filter((b) => b.status_booking === 'Batal').length;
  }, [filteredBookings]);

  // Chart Data: Top 5 Unit Terlaris
  const topUnitsData = useMemo(() => {
    const map: { [unit: string]: number } = {};

    filteredBookings.forEach((b) => {
      if (b.status_booking === 'Batal') return;
      map[b.kode_unit] = (map[b.kode_unit] || 0) + (Number(b.durasi_efektif) || 0);
    });

    return Object.entries(map)
      .map(([unit, jam]) => ({ unit, jam }))
      .sort((a, b) => b.jam - a.jam)
      .slice(0, 5);
  }, [filteredBookings]);

  // Handler Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tanggal',
      'Pelanggan',
      'Unit',
      'Waktu Sewa',
      'Durasi (Jam)',
      'Sumber',
      'Status Booking',
    ];

    const escapeCSV = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredBookings.map((b) => [
      b.tanggal_booking,
      b.nama_pelanggan,
      b.kode_unit,
      `${b.jam_mulai.substring(0, 5)} - ${b.jam_selesai.substring(0, 5)}`,
      b.durasi_efektif,
      b.sumber_booking,
      b.status_booking,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(';'),
      ...rows.map((row) => row.map(escapeCSV).join(';')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AkibaCore_Laporan_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-b from-sky-50/40 to-white">
        <div className="h-8 w-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-linear-to-b from-sky-50/40 to-white pb-14">
      <Navbar role="owner" />

      <div className="mx-auto flex w-full max-w-7xl flex-col space-y-5 px-3 pt-5 sm:px-6">

        {/* Top Header & Date/Status Filter */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50/80 to-white p-5 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)] lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(14,165,233,0.7)] shrink-0">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-sky-950 tracking-tight">
                  Analytics & Laporan Booking
                </h1>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                  Owner Access
                </span>
              </div>
              <p className="text-xs text-sky-600/80">
                Analisis dinamika sewa unit dan statistik operasional.
              </p>
            </div>
          </div>

          {/* Action Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-wrap">

            {/* Dropdown Filter Status Booking */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-sky-200 bg-white px-3 py-1.5 text-xs text-sky-900 shadow-2xs">
              <Filter className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-sky-900 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Active">Active</option>
                <option value="Terkonfirmasi">Terkonfirmasi</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-0.5 rounded-2xl border border-sky-200 bg-sky-100/60 p-1 text-xs font-bold">
              {(
                [
                  ['today', 'Hari Ini'],
                  ['week', '7 Hari'],
                  ['month', 'Bulan Ini'],
                  ['all', 'Semua'],
                  ['custom', 'Custom'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRangeType(key)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${rangeType === key
                    ? 'bg-sky-500 font-bold text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)]'
                    : 'text-sky-800 hover:bg-white/80 hover:text-sky-950'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Date Input */}
            {rangeType === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-2xl border border-sky-200 bg-white px-3 py-1.5 text-sky-900 font-mono text-xs focus:border-sky-500 focus:outline-hidden shadow-2xs"
                />
                <span className="text-sky-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-2xl border border-sky-200 bg-white px-3 py-1.5 text-sky-900 font-mono text-xs focus:border-sky-500 focus:outline-hidden shadow-2xs"
                />
              </div>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 shadow-2xs transition-all active:scale-95 shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-sky-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-sky-600 text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px]">Jam Terbooking</span>
              <div className="h-7 w-7 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-sky-950 font-mono">
                {totalJamTerjual} <span className="text-xs font-bold text-sky-500">Jam</span>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-sky-600/80 font-bold">
              Total waktu unit terpakai
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-sky-600 text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px]">Total Terbooking</span>
              <div className="h-7 w-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-sky-950 font-mono">
                {totalTransaksi} <span className="text-xs font-bold text-sky-500">Sesi</span>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-sky-600/80 font-bold">
              Sesi booking valid
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-center justify-between text-rose-600 text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px]">Dibatalkan</span>
              <div className="h-7 w-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-rose-950 font-mono">
                {totalDibatalkan} <span className="text-xs font-bold text-rose-500">Sesi</span>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-rose-600/80 font-bold">
              Sesi dibatalkan kasir/sistem
            </div>
          </div>
        </div>

        {/* Visual Chart: Top 5 Unit Terlaris */}
        <div className="p-5 rounded-3xl bg-white border border-sky-100 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              Top 5 Unit Konsol Paling Laris
            </h3>
            <p className="text-xs text-sky-600/80 mt-0.5">
              Unit dengan durasi penggunaan (jam sewa) tertinggi.
            </p>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUnitsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0f2fe" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#0369a1" />
                <YAxis dataKey="unit" type="category" tick={{ fontSize: 11 }} stroke="#0369a1" width={70} />
                <Tooltip
                  formatter={(val) => [`${val ?? 0} Jam`, 'Durasi Sewa']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #bae6fd' }}
                />
                <Bar dataKey="jam" radius={[0, 6, 6, 0]} barSize={24}>
                  {topUnitsData.map((_, index) => {
                    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Log Table */}
        <div className="p-5 rounded-3xl bg-white border border-sky-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-sky-700" />
              Rincian Transaksi
            </h3>
            <span className="text-xs text-sky-600 font-mono font-bold">
              {filteredBookings.length} Transaksi Terfilter
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-sky-100">
            <table className="w-full text-left text-xs text-sky-950 min-w-[700px]">
              <thead className="bg-sky-50 text-sky-800 uppercase text-[10px] font-bold tracking-wider border-b border-sky-100">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Pelanggan</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Waktu Sewa</th>
                  <th className="p-3.5">Durasi</th>
                  <th className="p-3.5">Sumber</th>
                  <th className="p-3.5">Status Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50 bg-white">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-sky-400 font-medium">
                      Tidak ada transaksi pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-sky-50/45 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-sky-600">
                        {b.tanggal_booking}
                      </td>
                      <td className="p-3.5 font-bold text-sky-950">
                        {b.nama_pelanggan}
                      </td>
                      <td className="p-3.5 font-bold text-sky-900 font-mono">{b.kode_unit}</td>
                      <td className="p-3.5 font-mono text-[11px] text-sky-700">
                        {b.jam_mulai.substring(0, 5)} - {b.jam_selesai.substring(0, 5)}
                      </td>
                      <td className="p-3.5 text-sky-700 font-medium">{b.durasi_efektif} Jam</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 bg-sky-50 text-sky-700">
                          {b.sumber_booking}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${b.status_booking === 'Batal'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : b.status_booking === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : b.status_booking === 'Terkonfirmasi'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                        >
                          {b.status_booking}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}