'use client';

import React from 'react';
import { addDays, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookingSchedule, Unit } from '@/types/database';
import {
  getOperationalBookingStart,
  getTodayDateString,
} from '@/lib/utils';

interface WeeklyMatrixGridProps {
  units: Unit[];
  bookings: BookingSchedule[];
  onSelectDate: (dateStr: string) => void;
}

const parseSafeDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function WeeklyMatrixGrid({
  units,
  bookings,
  onSelectDate,
}: WeeklyMatrixGridProps) {
  const today = parseSafeDate(getTodayDateString());
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const classes = Array.from(new Set(units.map((unit) => unit.kelas)));

  // Generate slot jam universal secara konsisten untuk semua hari (09:00 - 02:00)
  const timeRows: { label: string; minutes: number; value: string }[] = [];
  
  // Jam 09:00 sampai 23:30
  for (let hour = 9; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const minutes = hour * 60 + minute;
      timeRows.push({ label, minutes, value: label });
    }
  }
  // Jam 00:00 sampai 02:00 (dini hari berikutnya)
  for (let hour = 0; hour < 2; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const minutes = (24 + hour) * 60 + minute;
      timeRows.push({ label, minutes, value: label });
    }
  }

  const bookingsByDateAndUnit = new Map<string, BookingSchedule[]>();

  bookings.forEach((booking) => {
    if (booking.status_booking === 'Batal') return;

    const key = `${booking.tanggal_booking}:${booking.kode_unit}`;
    const unitBookings = bookingsByDateAndUnit.get(key);
    if (unitBookings) {
      unitBookings.push(booking);
    } else {
      bookingsByDateAndUnit.set(key, [booking]);
    }
  });

  return (
    <div className="overflow-auto max-h-[65vh]">
      {units.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Tidak ada unit yang tersedia untuk ditampilkan.
        </p>
      ) : (
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-20 bg-white">
            <tr className="border-b border-slate-200">
              <th
                scope="col"
                className="sticky left-0 z-30 min-w-20 bg-white px-3 py-2 text-slate-600 font-bold"
              >
                Jam
              </th>
              {dates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');

                return (
                  <th key={dateStr} scope="col" className="min-w-28 px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectDate(dateStr)}
                      className="rounded-lg px-2 py-1 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#007AFF] transition-colors w-full"
                    >
                      <span className="block font-semibold text-slate-700">
                        {format(date, 'EEE, d MMM', { locale: id })}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timeRows.map((timeSlot) => (
              <tr key={timeSlot.minutes} className="hover:bg-slate-50/50">
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-mono font-semibold text-slate-700"
                >
                  {timeSlot.label}
                </th>
                {dates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const slotTimeValue = timeSlot.value;
                  const slotStart = getOperationalBookingStart(slotTimeValue, dateStr);
                  const availableByClass = new Map(classes.map((category) => [category, 0]));

                  units.forEach((unit) => {
                    const unitBookings =
                      bookingsByDateAndUnit.get(`${dateStr}:${unit.kode_unit}`) ?? [];
                    const isOccupied = unitBookings.some((booking) => {
                      const bookingStart = getOperationalBookingStart(
                        booking.jam_mulai,
                        dateStr
                      );
                      const bookingEnd = bookingStart + booking.durasi_efektif * 60;
                      return slotStart < bookingEnd && slotStart + 30 > bookingStart;
                    });

                    if (!isOccupied) {
                      availableByClass.set(
                        unit.kelas,
                        (availableByClass.get(unit.kelas) ?? 0) + 1
                      );
                    }
                  });

                  const availableCount = Array.from(availableByClass.values()).reduce(
                    (total, count) => total + count,
                    0
                  );
                  const availabilityRatio = availableCount / units.length;
                  const availabilityStyle =
                    availableCount === 0
                      ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                      : availabilityRatio >= 0.5
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100';
                  
                  const summary = classes
                    .map((category) => `${category}: ${availableByClass.get(category) ?? 0}`)
                    .join(', ');

                  return (
                    <td key={dateStr} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        aria-label={`${format(date, 'EEEE d MMMM', {
                          locale: id,
                        })} pukul ${timeSlot.label}, unit kosong: ${summary}`}
                        className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] ${availabilityStyle}`}
                      >
                        {classes.map((category) => (
                          <span
                            key={category}
                            className="block whitespace-nowrap text-[10px] leading-4 font-mono font-medium"
                          >
                            {category}: {availableByClass.get(category) ?? 0}
                          </span>
                        ))}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}