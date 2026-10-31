import { Unit, Booking, CashierOperator } from '@/types/database';
import { getTodayDateString } from './utils';

const SAMPLE_OPERATORS: CashierOperator[] = ['Amar Waly', 'Indy', 'Mona', 'Rakel', 'Adit', 'Nida'];

const UNIT_DATA = [
  ['VVIP5-01', 'VVIP PS5', 'Smoking | Lt 2', 35000],
  ['VVIP5-02', 'VVIP PS5', 'Non Smoking | Lt 3', 35000],
  ['VIP4-01', 'VIP PS4', 'Smoking | Lt 2', 25000],
  ['VIP4-02', 'VIP PS4', 'Smoking | Lt 2', 25000],
  ['VIP4-03', 'VIP PS4', 'Non Smoking | Lt 3', 25000],
  ['VIP4-04', 'VIP PS4', 'Non Smoking | Lt 3', 25000],
  ['VIP5-01', 'VIP PS5', 'Smoking | Lt 3', 30000],
  ['VIP5-02', 'VIP PS5', 'Non Smoking | Lt 3', 30000],
  ['REG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000],
  ['PS3-01', 'Reguler PS3', 'Non Smoking | Lt 1', 6000],
  ['PS3-02', 'Reguler PS3', 'Non Smoking | Lt 1', 6000],
  ['REG-04', 'Reguler PS4', 'Non Smoking | Lt 1', 10000],
  ['REG-05', 'Reguler PS4', 'Non Smoking | Lt 1', 10000],
  ['REG-06', 'Reguler PS4', 'Non Smoking | Lt 1', 10000],
  ['REG-07', 'Reguler PS4', 'Non Smoking | Lt 1', 10000],
  ['REG-08', 'Reguler PS4', 'Smoking | Lt 2', 10000],
  ['REG-09', 'Reguler PS4', 'Smoking | Lt 2', 10000],
  ['REG-10', 'Reguler PS4', 'Smoking | Lt 2', 10000],
] as const;

export const INITIAL_UNITS: Unit[] = UNIT_DATA.map(
  ([kode_unit, kelas, preferensi_zona, tarif_per_jam], index) => ({
    kode_unit,
    kode_cabang: 'CBG-01',
    kelas,
    preferensi_zona,
    tarif_per_jam,
    urutan: index + 1,
    is_active: true,
  })
);

export const getInitialBookings = (targetDate?: string): Booking[] => {
  // Mengosongkan data dummy booking agar tabel benar-benar bersih saat dari Supabase kosong
  return [];
};