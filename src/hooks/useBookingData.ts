'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Unit,
  Booking,
  BookingFormData,
  BookingSchedule,
  Database,
} from '@/types/database';
import {
  addHoursToTime,
  getOperationalBookingStart,
  getOperationalStartHour,
} from '@/lib/utils';

export function useBookingData<TPublic extends boolean = false>(
  selectedDate: string,
  options?: { publicOnly?: TPublic }
) {
  const queryClient = useQueryClient();
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const isConfigured = isSupabaseConfigured();
  const publicOnly = options?.publicOnly ?? false;
  type VisibleBooking = TPublic extends true ? BookingSchedule : Booking;

  // 1. Fetch Units
  const unitsQuery = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      if (!isConfigured) {
        console.error('Supabase belum dikonfigurasi. Data unit tidak dapat dimuat.');
        return [];
      }

      const supabase = createClient<Database>();
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('urutan', { ascending: true });

      if (error) {
        console.error('Gagal memuat unit dari Supabase:', error.message || JSON.stringify(error));
        return [];
      }
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Bookings for Selected Date
  const bookingsQuery = useQuery<VisibleBooking[]>({
    queryKey: ['bookings', selectedDate, publicOnly ? 'public' : 'staff'],
    queryFn: async () => {
      if (!isConfigured) {
        console.error('Supabase belum dikonfigurasi. Data booking tidak dapat dimuat.');
        return [];
      }

      const supabase = createClient<Database>();
      const result = publicOnly
        ? await supabase
            .from('bookings')
            .select('id,tanggal_booking,jam_mulai,jam_selesai,durasi_efektif,nama_pelanggan,kode_unit,status_booking,sumber_booking')
            .eq('tanggal_booking', selectedDate)
            .order('jam_mulai', { ascending: true })
        : await supabase
            .from('bookings')
            .select('*')
            .eq('tanggal_booking', selectedDate)
            .order('jam_mulai', { ascending: true });

      if (result.error) {
        console.error('Gagal memuat booking dari Supabase:', result.error.message || JSON.stringify(result.error));
        return [];
      }
      return (result.data ?? []) as VisibleBooking[];
    },
    staleTime: 1000 * 15,
  });

  // 3. Setup Supabase Realtime Subscription
  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const supabase = createClient<Database>();
    const channel = supabase
      .channel(`public:bookings:${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, queryClient, isConfigured]);

  // 4. Create Booking Handler
  const createBooking = useCallback(
    async (formData: BookingFormData): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
      if (!isConfigured) {
        return { success: false, error: 'Supabase belum dikonfigurasi.' };
      }

      const units = unitsQuery.data ?? [];
      const targetUnit = units.find((u) => u.kode_unit === formData.kode_unit);

      if (!targetUnit) {
        return { success: false, error: `Unit ${formData.kode_unit} tidak ditemukan.` };
      }

      const jam_selesai = addHoursToTime(formData.jam_mulai, formData.durasi_efektif);
      const biaya_main = formData.durasi_efektif * targetUnit.tarif_per_jam;
      const bookingStart = getOperationalBookingStart(formData.jam_mulai, formData.tanggal_booking);
      const bookingEnd = bookingStart + formData.durasi_efektif * 60;
      const openingStart = getOperationalStartHour(formData.tanggal_booking) * 60;

      if (bookingStart < openingStart || bookingEnd > 26 * 60) {
        return {
          success: false,
          error: `Jam booking harus berada dalam jam operasional hingga 02:00 (maksimal ${Math.floor((26 * 60 - bookingStart) / 60)} jam dari waktu mulai).`,
        };
      }

      // Check conflict client-side
      const currentBookings = bookingsQuery.data || [];
      const hasConflict = currentBookings.some((b) => {
        if (b.kode_unit !== formData.kode_unit) return false;
        if (b.status_booking === 'Batal') return false;
        const existingStart = getOperationalBookingStart(b.jam_mulai, formData.tanggal_booking);
        const existingEnd = existingStart + b.durasi_efektif * 60;
        return bookingStart < existingEnd && bookingEnd > existingStart;
      });

      if (hasConflict) {
        return {
          success: false,
          error: `Jadwal bentrok! Unit ${formData.kode_unit} sudah terisi di rentang ${formData.jam_mulai.substring(0, 5)} - ${jam_selesai.substring(0, 5)}.`,
        };
      }

      const formattedJamMulai = formData.jam_mulai.length === 5 ? `${formData.jam_mulai}:00` : formData.jam_mulai;

      const supabase = createClient<Database>();
      const insertPayload: Database['public']['Tables']['bookings']['Insert'] = {
        timestamp_input: new Date().toISOString(),
        kode_cabang: 'CBG-01',
        tanggal_booking: formData.tanggal_booking,
        jam_mulai: formattedJamMulai,
        jam_selesai,
        durasi_efektif: formData.durasi_efektif,
        nama_pelanggan: formData.nama_pelanggan,
        no_whatsapp: formData.no_whatsapp || '-',
        kode_unit: formData.kode_unit,
        biaya_main,
        total: biaya_main,
        status_pembayaran: formData.status_pembayaran,
        status_booking: formData.status_booking || 'Terkonfirmasi',
        sumber_booking: formData.sumber_booking || 'Booking',
        operator_kasir: formData.operator_kasir,
        catatan: formData.catatan || null,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('Gagal menyimpan booking ke Supabase:', error.message || JSON.stringify(error));
        return { success: false, error: error.message };
      }

      await queryClient.invalidateQueries({ queryKey: ['bookings', formData.tanggal_booking] });
      return { success: true, booking: data as Booking };
    },
    [unitsQuery.data, bookingsQuery.data, isConfigured, queryClient]
  );

  // 5. Update Status Booking Handler
  const updateBookingStatus = useCallback(
    async (
      bookingId: string,
      status: Booking['status_booking'],
      statusPembayaran?: Booking['status_pembayaran']
    ) => {
      if (!isConfigured) {
        return { success: false, error: 'Supabase belum dikonfigurasi.' };
      }

      const supabase = createClient<Database>();
      const updatePayload: Database['public']['Tables']['bookings']['Update'] = {
        status_booking: status,
        ...(statusPembayaran ? { status_pembayaran: statusPembayaran } : {}),
      };

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (error) {
        console.error('Gagal memperbarui booking di Supabase:', error.message || JSON.stringify(error));
        return { success: false, error: error.message };
      }

      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      return { success: true };
    },
    [isConfigured, queryClient]
  );

  return {
    units: unitsQuery.data ?? [],
    bookings: bookingsQuery.data ?? [],
    isLoading: unitsQuery.isLoading || bookingsQuery.isLoading,
    isRealtimeActive,
    isSupabaseConfigured: isConfigured,
    createBooking,
    updateBookingStatus,
    refetch: bookingsQuery.refetch,
  };
}