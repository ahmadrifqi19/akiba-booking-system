import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatTimeShort(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const norm = totalMinutes % (24 * 60);
  const hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

export function addHoursToTime(timeStr: string, hours: number): string {
  const totalMins = (timeToMinutes(timeStr) + Math.round(hours * 60)) % (24 * 60);
  const endHours = Math.floor(totalMins / 60);
  const endMinutes = totalMins % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
}

export function checkTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return sA < eB && eA > sB;
}

export function generateTimeSlots(startHour = 9, endHour = 24, stepMinutes = 30): string[] {
  const slots: string[] = [];
  const startTotal = startHour * 60;
  const endTotal = endHour * 60;

  for (let m = startTotal; m < endTotal; m += stepMinutes) {
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export interface OperationalTimeSlot {
  value: string;
  minutes: number;
  label: string;
}

export function getOperationalStartHour(date: string): number {
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 9 : 10;
}

export function getOperationalTimeSlots(date: string): OperationalTimeSlot[] {
  const startMinutes = getOperationalStartHour(date) * 60;
  const endMinutes = 26 * 60;
  const slots: OperationalTimeSlot[] = [];

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const clockMinutes = minutes % (24 * 60);
    const label = `${Math.floor(clockMinutes / 60).toString().padStart(2, '0')}:${(clockMinutes % 60).toString().padStart(2, '0')}`;
    slots.push({ value: label, minutes, label });
  }

  return slots;
}

export function getOperationalBookingStart(time: string, date: string): number {
  const clockMinutes = timeToMinutes(time);
  return clockMinutes < getOperationalStartHour(date) * 60
    ? clockMinutes + 24 * 60
    : clockMinutes;
}

export function getTodayDateString(): string {
  if (typeof window === 'undefined') {
    return '2026-10-22';
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
