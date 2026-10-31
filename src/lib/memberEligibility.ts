import { Unit } from '@/types/database';

export interface MemberEligibilityResult {
  isEligible: boolean;
  minHours: number;
  category: 'VIP / VVIP' | 'Reguler';
  statusText: 'Layak/Memenuhi Syarat Member' | 'Belum Memenuhi Syarat Member';
  description: string;
}

/**
 * Logika Syarat Member:
 * - Jika kelas unit adalah VIP / VVIP dan durasi efektif >= 2 Jam,
 *   maka status sistem menampilkan keterangan "Layak/Memenuhi Syarat Member".
 * - Jika kelas unit adalah Reguler (Reguler/PS3) dan durasi efektif >= 3 Jam,
 *   maka status sistem menampilkan keterangan "Layak/Memenuhi Syarat Member".
 * - Jika kurang dari ketentuan di atas, tampilkan status informasi belum memenuhi syarat.
 */
export function checkMemberEligibility(
  durasi: number,
  unit?: Unit | null,
  fallbackKodeUnit?: string
): MemberEligibilityResult {
  const kelasUpper = (unit?.kelas || '').toUpperCase();
  const kodeUpper = (unit?.kode_unit || fallbackKodeUnit || '').toUpperCase();

  const isVip =
    kelasUpper.includes('VIP') ||
    kodeUpper.startsWith('VIP') ||
    kodeUpper.startsWith('VVIP');

  if (isVip) {
    const minHours = 2;
    const isEligible = durasi >= minHours;
    return {
      isEligible,
      minHours,
      category: 'VIP / VVIP',
      statusText: isEligible ? 'Layak/Memenuhi Syarat Member' : 'Belum Memenuhi Syarat Member',
      description: isEligible
        ? `Durasi rental ${durasi} jam memenuhi syarat member VIP/VVIP (min. ${minHours} jam).`
        : `Durasi rental ${durasi} jam belum memenuhi syarat member (minimal ${minHours} jam untuk VIP/VVIP).`,
    };
  }

  const minHours = 3;
  const isEligible = durasi >= minHours;
  return {
    isEligible,
    minHours,
    category: 'Reguler',
    statusText: isEligible ? 'Layak/Memenuhi Syarat Member' : 'Belum Memenuhi Syarat Member',
    description: isEligible
      ? `Durasi rental ${durasi} jam memenuhi syarat member Reguler (min. ${minHours} jam).`
      : `Durasi rental ${durasi} jam belum memenuhi syarat member (minimal ${minHours} jam untuk Reguler/PS3).`,
  };
}

