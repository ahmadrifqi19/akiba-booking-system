export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatusPembayaran = 'Belum Bayar' | 'Lunas (Bayar di Kasir)';
export type BookingStatus = 'Terkonfirmasi' | 'Active' | 'Selesai' | 'Batal';
export type BookingSumber = 'Booking' | 'Walk-in';
export type CashierOperator = string;

export interface Unit {
  kode_unit: string;
  kode_cabang: string;
  kelas: string;
  preferensi_zona: string;
  tarif_per_jam: number;
  is_active?: boolean;
  urutan?: number;
  created_at?: string;
}

export interface Cabang {
  kode_cabang: string;
  nama_cabang: string;
  alamat?: string;
  no_telepon?: string;
  is_active?: boolean;
  jam_buka_weekday?: string;
  jam_buka_weekend?: string;
  jam_tutup?: string;
  created_at?: string;
}

export interface Operator {
  id: string;
  kode_cabang: string;
  nama_operator: string;
  created_at?: string;
}

export interface ZonaRuangan {
  id: string;
  nama_zona: string;
  tipe_rokok: 'Smoking' | 'Non-Smoking';
  lantai: string;
  fasilitas?: string;
  deskripsi?: string;
}

export interface PengaturanOperasional {
  kode_cabang: string;
  jam_buka_weekday: string;
  jam_buka_weekend: string;
  jam_tutup: string;
  durasi_maksimal_jam?: number;
  catatan?: string;
}

export interface BookingSchedule {
  id: string;
  tanggal_booking: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_efektif: number;
  nama_pelanggan: string;
  kode_unit: string;
  status_booking: BookingStatus;
  sumber_booking: BookingSumber;
}

export interface Booking extends BookingSchedule {
  timestamp_input: string;
  kode_cabang: string;
  no_whatsapp: string;
  biaya_main: number;
  total: number;
  status_pembayaran: BookingStatusPembayaran;
  sumber_booking: BookingSumber;
  operator_kasir?: CashierOperator | null;
  operator_id?: string | null;
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
  units?: Unit;
}

export interface BookingFormData {
  kode_unit: string;
  tanggal_booking: string;
  jam_mulai: string;
  durasi_efektif: number;
  nama_pelanggan: string;
  no_whatsapp: string;
  status_pembayaran?: string;
  status_booking: BookingStatus;
  sumber_booking: BookingSumber;
  operator_kasir: CashierOperator;
  catatan?: string;
}

export type Database = {
  public: {
    Tables: {
      units: {
        Row: Omit<Unit, never>;
        Insert: Partial<Omit<Unit, never>> & {
          kode_unit: string;
          kelas: string;
          preferensi_zona: string;
          tarif_per_jam: number;
        };
        Update: Partial<Omit<Unit, never>>;
        Relationships: [];
      };
      bookings: {
        Row: Omit<Booking, never>;
        Insert: Partial<Omit<Booking, never>> & {
          tanggal_booking: string;
          jam_mulai: string;
          durasi_efektif: number;
          nama_pelanggan: string;
          no_whatsapp: string;
          kode_unit: string;
        };
        Update: Partial<Omit<Booking, never>>;
        Relationships: [];
      };
      cabang: {
        Row: Omit<Cabang, never>;
        Insert: Omit<Cabang, never>;
        Update: Partial<Omit<Cabang, never>>;
        Relationships: [];
      };
      operators: {
        Row: Omit<Operator, never>;
        Insert: Omit<Operator, 'id' | 'created_at'> & Partial<Pick<Operator, 'id' | 'created_at'>>;
        Update: Partial<Omit<Operator, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
