import { Unit, Booking, CashierOperator } from '@/types/database';
import { getTodayDateString } from './utils';

const SAMPLE_OPERATORS: CashierOperator[] = ['Amar Waly', 'Indy', 'Mona', 'Rakel'];

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
  const today = targetDate || (typeof window !== 'undefined' ? getTodayDateString() : '2026-10-22');
  const samples = [
    {
      id: 'bkg-101',
      jam_mulai: '10:00:00',
      jam_selesai: '12:00:00',
      durasi_efektif: 2,
      nama_pelanggan: 'Rifqi Pratama',
      no_whatsapp: '081234567890',
      kode_unit: 'VVIP5-01',
      status_pembayaran: 'Belum Bayar',
      status_booking: 'Terkonfirmasi',
      catatan: '',
    },
    {
      id: 'bkg-102',
      jam_mulai: '13:00:00',
      jam_selesai: '16:00:00',
      durasi_efektif: 3,
      nama_pelanggan: 'Dimas Arya',
      no_whatsapp: '085711223344',
      kode_unit: 'VVIP5-02',
      status_pembayaran: 'Lunas (Bayar di Kasir)',
      status_booking: 'Terkonfirmasi',
      catatan: '',
    },
    {
      id: 'bkg-103',
      jam_mulai: '14:00:00',
      jam_selesai: '17:00:00',
      durasi_efektif: 3,
      nama_pelanggan: 'Budi Santoso',
      no_whatsapp: '081399887766',
      kode_unit: 'VIP5-01',
      status_pembayaran: 'Lunas (Bayar di Kasir)',
      status_booking: 'Active',
      catatan: '',
    },
    {
      id: 'bkg-104',
      jam_mulai: '18:30:00',
      jam_selesai: '21:30:00',
      durasi_efektif: 3,
      nama_pelanggan: 'Kevin Sanjaya',
      no_whatsapp: '081822334455',
      kode_unit: 'REG-01',
      status_pembayaran: 'Belum Bayar',
      status_booking: 'Terkonfirmasi',
      catatan: '',
    },
  ] as const;

  return samples.map((sample, index) => {
    const unit = INITIAL_UNITS.find((item) => item.kode_unit === sample.kode_unit)!;
    const biaya_main = sample.durasi_efektif * unit.tarif_per_jam;

    let itemDate = today;
    if (!targetDate) {
      const d = new Date(today + 'T00:00:00');
      if (index === 2) d.setDate(d.getDate() - 1);
      if (index === 3) d.setDate(d.getDate() - 4);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      itemDate = `${yyyy}-${mm}-${dd}`;
    }

    return {
      ...sample,
      timestamp_input: `2026-10-22T${String(10 + index).padStart(2, '0')}:00:00Z`,
      kode_cabang: 'CBG-01',
      tanggal_booking: itemDate,
      biaya_main,
      total: biaya_main,
      sumber_booking: 'Booking',
      operator_kasir: SAMPLE_OPERATORS[index % SAMPLE_OPERATORS.length],
      operator_id: null,
    };
  });
};
