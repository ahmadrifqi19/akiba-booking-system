'use client';

import React, { useState, useMemo } from 'react';
import { useBookingData } from '@/hooks/useBookingData';
import Navbar from '@/components/layout/Navbar';
import { formatRupiah, getTodayDateString } from '@/lib/utils';
import { INITIAL_UNITS, getInitialBookings } from '@/lib/mockData';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Download,
  Users,
  Gamepad2,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [todayStr] = useState<string>(getTodayDateString);
  const [rangeType, setRangeType] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const { units, bookings } = useBookingData(todayStr);

  // Filter Data berdasarkan Rentang Tanggal
  const filteredBookings = useMemo(() => {
    const baseList = (bookings.length > 0 ? bookings : getInitialBookings()).filter(
      (b) => b.sumber_booking === 'Booking' || b.sumber_booking === 'Walk-in'
    );

    if (rangeType === 'all') return baseList;

    return baseList.filter((b) => {
      const bDate = b.tanggal_booking;
      if (rangeType === 'today') return bDate === todayStr;
      if (rangeType === 'custom') {
        if (!startDate || !endDate) return true;
        return bDate >= startDate && bDate <= endDate;
      }
      
      const targetDate = new Date(todayStr);
      if (rangeType === 'week') {
        targetDate.setDate(targetDate.getDate() - 7);
      } else if (rangeType === 'month') {
        targetDate.setMonth(targetDate.getMonth() - 1);
      }
      const cutoffStr = targetDate.toISOString().split('T')[0];
      return bDate >= cutoffStr && bDate <= todayStr;
    });
  }, [bookings, rangeType, startDate, endDate, todayStr]);

  // Metric 1: Total Omzet
  const totalOmzet = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status_booking !== 'Batal')
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [filteredBookings]);

  // Metric 2: Total Jam Terjual
  const totalJamTerjual = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status_booking !== 'Batal')
      .reduce((sum, b) => sum + (Number(b.durasi_efektif) || 0), 0);
  }, [filteredBookings]);

  // Metric 3: Total Transaksi Valid
  const totalTransaksi = useMemo(() => {
    return filteredBookings.filter((b) => b.status_booking !== 'Batal').length;
  }, [filteredBookings]);

  // Metric 4: Rata-rata per Transaksi
  const rataRataTransaksi = totalTransaksi > 0 ? totalOmzet / totalTransaksi : 0;

  // Chart Data 1: Tren Pendapatan per Tanggal
  const revenueTrendData = useMemo(() => {
    const map: { [date: string]: { date: string; omzet: number; jam: number } } = {};

    filteredBookings.forEach((b) => {
      if (b.status_booking === 'Batal') return;
      const d = b.tanggal_booking;
      if (!map[d]) {
        map[d] = { date: d, omzet: 0, jam: 0 };
      }
      map[d].omzet += Number(b.total) || 0;
      map[d].jam += Number(b.durasi_efektif) || 0;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredBookings]);

  // Chart Data 2: Omzet per Kategori Konsol (PS3 vs PS4 vs PS5)
  const consoleCategoryData = useMemo(() => {
    const activeUnits = units.length > 0 ? units : INITIAL_UNITS;
    const map: { [key: string]: number } = { PS3: 0, PS4: 0, PS5: 0 };

    filteredBookings.forEach((b) => {
      if (b.status_booking === 'Batal') return;
      const matchedUnit = activeUnits.find((u) => u.kode_unit === b.kode_unit);
      const category = matchedUnit?.kelas?.match(/PS[345]/)?.[0] || 'PS4';
      map[category] = (map[category] || 0) + (Number(b.total) || 0);
    });

    return Object.entries(map).map(([category, omzet]) => ({
      category,
      omzet,
    }));
  }, [filteredBookings, units]);

  // Chart Data 3: Sumber Booking (Booking vs Walk-in)
  const sourceDistributionData = useMemo(() => {
    let bookingCount = 0;
    let walkInCount = 0;

    filteredBookings.forEach((b) => {
      if (b.status_booking === 'Batal') return;
      if (b.sumber_booking === 'Booking') bookingCount++;
      else if (b.sumber_booking === 'Walk-in') walkInCount++;
    });

    return [
      { name: 'Booking', value: bookingCount },
      { name: 'Walk-in', value: walkInCount },
    ];
  }, [filteredBookings]);

  // Chart Data 4: Top 5 Unit Terlaris (Berdasarkan Jam Tersewa)
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

  // Colors Palette
  const PIE_COLORS = ['#007AFF', '#10B981'];

  // Handler Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Booking',
      'Tanggal',
      'Jam Mulai',
      'Jam Selesai',
      'Durasi (Jam)',
      'Kode Unit',
      'Pelanggan',
      'Total (Rp)',
      'Status Bayar',
      'Status Booking',
      'Sumber',
    ];

    const rows = filteredBookings.map((b) => [
      b.id,
      b.tanggal_booking,
      b.jam_mulai,
      b.jam_selesai,
      b.durasi_efektif,
      b.kode_unit,
      `"${b.nama_pelanggan.replace(/"/g, '""')}"`,
      b.total,
      b.status_pembayaran,
      b.status_booking,
      b.sumber_booking,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AkibaCore_Laporan_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Navbar role="owner" />
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col space-y-5 bg-canvas px-3 pb-14 pt-5 sm:px-6">
        
        {/* Top Header & Date Filter */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:flex-row lg:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Analytics & Laporan Finansial
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-900 border border-blue-200">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analisis pendapatan, dinamika sewa unit, distribusi sumber booking, dan statistik operasional.
            </p>
          </div>

          {/* Action Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-medium">
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
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    rangeType === key
                      ? 'bg-[#007AFF] font-semibold text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
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
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-mono text-xs focus:outline-blue-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-mono text-xs focus:outline-blue-500"
                />
              </div>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Omzet */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Omzet</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {formatRupiah(totalOmzet)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>Total pendapatan sewa</span>
            </div>
          </div>

          {/* Card 2: Total Jam Terjual */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Jam Terjual</span>
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center border border-blue-100">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {totalJamTerjual} <span className="text-xs font-medium text-slate-500">Jam</span>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Total waktu unit terpakai
            </div>
          </div>

          {/* Card 3: Total Transaksi */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Transaksi</span>
              <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {totalTransaksi} <span className="text-xs font-medium text-slate-500">Sesi</span>
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Sesi booking valid
            </div>
          </div>

          {/* Card 4: Rata-rata per Transaksi */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Rata-rata / Sesi</span>
              <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {formatRupiah(rataRataTransaksi)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Rata-rata omzet per transaksi
            </div>
          </div>
        </div>

        {/* Visual Charts Grid 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Chart 1: Area Chart Tren Omzet (Spans 2 Cols) */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#007AFF]" />
                  Dinamika Pendapatan Harian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grafik tren omzet berdasarkan akumulasi tanggal transaksi.
                </p>
              </div>
            </div>

            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                    tickFormatter={(val: number) => `Rp${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val ?? 0)), 'Omzet']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                    <Area
                    type="monotone"
                    dataKey="omzet"
                    stroke="#007AFF"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOmzet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Donut Chart Sumber Booking */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                Distribusi Sumber Booking
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan transaksi antara Online Booking & Walk-in.
              </p>
            </div>

            <div className="h-52 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Visual Charts Grid 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Chart 3: Omzet per Kategori Konsol (PS3/PS4/PS5) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-purple-600" />
                Kontribusi Omzet per Kategori Konsol
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan pendapatan dari tipe konsol PlayStation.
              </p>
            </div>

            <div className="h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consoleCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                    tickFormatter={(val: number) => `Rp${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val ?? 0)), 'Omzet']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="omzet" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Top 5 Unit Terlaris */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Top 5 Unit Konsol Paling Laris
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unit dengan durasi penggunaan (jam sewa) tertinggi.
              </p>
            </div>

            <div className="h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUnitsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis dataKey="unit" type="category" tick={{ fontSize: 11 }} stroke="#64748B" width={70} />
                  <Tooltip
                    formatter={(val) => [`${val ?? 0} Jam`, 'Durasi Sewa']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="jam" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transaction Log Table */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-700" />
              Rincian Transaksi
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {filteredBookings.length} Transaksi Terfilter
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Pelanggan</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Waktu Sewa</th>
                  <th className="p-3">Durasi</th>
                  <th className="p-3">Total Tagihan</th>
                  <th className="p-3">Sumber</th>
                  <th className="p-3">Status Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      Tidak ada transaksi pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {b.tanggal_booking}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {b.nama_pelanggan}
                      </td>
                      <td className="p-3 font-bold text-slate-900 font-mono">{b.kode_unit}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {b.jam_mulai.substring(0, 5)} - {b.jam_selesai.substring(0, 5)}
                      </td>
                      <td className="p-3 text-slate-600">{b.durasi_efektif} Jam</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {formatRupiah(b.total)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                          {b.sumber_booking}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            b.status_pembayaran === 'Lunas (Bayar di Kasir)'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {b.status_pembayaran}
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
    </>
  );
}