-- ==============================================================================
-- AKIBA CORE REAL-TIME BOOKING & VISUAL SCHEDULE SYSTEM
-- Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('Terkonfirmasi', 'Active', 'Selesai', 'Batal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_sumber AS ENUM ('Booking', 'Walk-in');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.units (
    kode_unit TEXT PRIMARY KEY,
    kode_cabang TEXT NOT NULL DEFAULT 'CBG-01',
    kelas TEXT NOT NULL,
    preferensi_zona TEXT NOT NULL,
    tarif_per_jam NUMERIC(12, 2) NOT NULL CHECK (tarif_per_jam > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    urutan INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp_input TIMESTAMPTZ NOT NULL DEFAULT now(),
    kode_cabang TEXT NOT NULL DEFAULT 'CBG-01',
    tanggal_booking DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    durasi_efektif INTEGER NOT NULL CHECK (durasi_efektif > 0),
    nama_pelanggan TEXT NOT NULL,
    no_whatsapp TEXT NOT NULL,
    kode_unit TEXT NOT NULL REFERENCES public.units(kode_unit) ON UPDATE CASCADE ON DELETE RESTRICT,
    biaya_main NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    status_pembayaran TEXT NOT NULL DEFAULT 'Belum Bayar',
    status_booking TEXT NOT NULL DEFAULT 'Terkonfirmasi'
        CHECK (status_booking IN ('Terkonfirmasi', 'Active', 'Selesai', 'Batal')),
    sumber_booking TEXT NOT NULL DEFAULT 'Booking'
        CHECK (sumber_booking IN ('Booking', 'Walk-in')),
    operator_kasir TEXT,
    operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bookings_status_pembayaran_check
        CHECK (status_pembayaran IN ('Belum Bayar', 'Lunas (Bayar di Kasir)'))
);

-- Migrate existing installs away from deposits, add-ons, and payment methods.
DROP TRIGGER IF EXISTS trg_calc_booking_fields ON public.bookings;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_pembayaran_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_sumber_booking_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_operator_kasir_check;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operator_kasir TEXT;

UPDATE public.bookings
SET total = biaya_main,
    status_pembayaran = CASE
        WHEN status_pembayaran = 'Lunas' THEN 'Lunas (Bayar di Kasir)'
        ELSE 'Belum Bayar'
    END,
    sumber_booking = CASE
        WHEN sumber_booking = 'Walk-in' THEN 'Walk-in'
        ELSE 'Booking'
    END;

ALTER TABLE public.bookings
    DROP COLUMN IF EXISTS tambahan_order,
    DROP COLUMN IF EXISTS biaya_tambahan,
    DROP COLUMN IF EXISTS diskon,
    DROP COLUMN IF EXISTS dp,
    DROP COLUMN IF EXISTS sisa_bayar,
    DROP COLUMN IF EXISTS metode_bayar,
    DROP COLUMN IF EXISTS jumlah_pemain;

ALTER TABLE public.bookings
    ALTER COLUMN status_pembayaran SET DEFAULT 'Belum Bayar',
    ALTER COLUMN sumber_booking SET DEFAULT 'Booking',
    ADD CONSTRAINT bookings_status_pembayaran_check
        CHECK (status_pembayaran IN ('Belum Bayar', 'Lunas (Bayar di Kasir)')),
    ADD CONSTRAINT bookings_sumber_booking_check
        CHECK (sumber_booking IN ('Booking', 'Walk-in'));

ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_operator_kasir_check
        CHECK (
            operator_kasir IS NULL OR
            operator_kasir IN ('Amar Waly', 'Indy', 'Mona', 'Rakel', 'Adit', 'Nida')
        );

CREATE INDEX IF NOT EXISTS idx_bookings_lookup
ON public.bookings (tanggal_booking, kode_unit, status_booking);

CREATE INDEX IF NOT EXISTS idx_bookings_date_range
ON public.bookings (tanggal_booking, jam_mulai, jam_selesai);

CREATE INDEX IF NOT EXISTS idx_units_cabang
ON public.units (kode_cabang, urutan);

CREATE OR REPLACE FUNCTION public.fn_calc_booking_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_tarif NUMERIC(12, 2);
    v_operational_start TIMESTAMP;
    v_operational_end TIMESTAMP;
BEGIN
    SELECT tarif_per_jam INTO v_tarif
    FROM public.units
    WHERE kode_unit = NEW.kode_unit AND is_active = true;

    IF v_tarif IS NULL THEN
        RAISE EXCEPTION 'Unit dengan kode % tidak ditemukan atau tidak aktif', NEW.kode_unit;
    END IF;

    IF NEW.jam_selesai IS NULL OR NEW.jam_selesai = NEW.jam_mulai THEN
        NEW.jam_selesai := (NEW.jam_mulai + (NEW.durasi_efektif || ' hours')::INTERVAL)::TIME;
    END IF;

    IF NEW.sumber_booking NOT IN ('Booking', 'Walk-in') THEN
        RAISE EXCEPTION 'Sumber booking tidak valid: %', NEW.sumber_booking;
    END IF;
    IF TG_OP = 'INSERT' AND NEW.operator_kasir IS NULL THEN
        RAISE EXCEPTION 'Operator kasir wajib dipilih.';
    END IF;
    IF NEW.operator_kasir IS NOT NULL AND NEW.operator_kasir NOT IN
       ('Amar Waly', 'Indy', 'Mona', 'Rakel', 'Adit', 'Nida') THEN
        RAISE EXCEPTION 'Operator kasir tidak valid: %', NEW.operator_kasir;
    END IF;

    v_operational_start := NEW.tanggal_booking +
        CASE WHEN EXTRACT(ISODOW FROM NEW.tanggal_booking) IN (5, 6, 7)
             THEN TIME '09:00' ELSE TIME '10:00' END;
    v_operational_end := NEW.tanggal_booking + INTERVAL '1 day' + INTERVAL '2 hours';
    IF NEW.jam_mulai < CASE
        WHEN EXTRACT(ISODOW FROM NEW.tanggal_booking) IN (5, 6, 7)
            THEN TIME '09:00'
        ELSE TIME '10:00'
    END THEN
        v_operational_start := v_operational_start + INTERVAL '1 day';
    ELSE
        v_operational_start := NEW.tanggal_booking + NEW.jam_mulai;
    END IF;
    IF v_operational_start < NEW.tanggal_booking +
       CASE WHEN EXTRACT(ISODOW FROM NEW.tanggal_booking) IN (5, 6, 7)
            THEN TIME '09:00' ELSE TIME '10:00' END
       OR v_operational_start + (NEW.durasi_efektif || ' hours')::INTERVAL > v_operational_end THEN
        RAISE EXCEPTION 'Booking harus berada dalam jam operasional sampai pukul 02:00.';
    END IF;

    NEW.biaya_main := NEW.durasi_efektif * v_tarif;
    NEW.total := NEW.biaya_main;
    NEW.status_pembayaran := COALESCE(NEW.status_pembayaran, 'Belum Bayar');
    NEW.sumber_booking := COALESCE(NEW.sumber_booking, 'Booking');
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_calc_booking_fields
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_calc_booking_fields();

CREATE OR REPLACE FUNCTION public.fn_prevent_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
    v_start TIMESTAMP;
    v_end TIMESTAMP;
BEGIN
    IF NEW.status_booking IN ('Terkonfirmasi', 'Active') THEN
        v_start := NEW.tanggal_booking + NEW.jam_mulai;
        IF NEW.jam_mulai < CASE
            WHEN EXTRACT(ISODOW FROM NEW.tanggal_booking) IN (5, 6, 7)
                THEN TIME '09:00'
            ELSE TIME '10:00'
        END THEN
            v_start := v_start + INTERVAL '1 day';
        END IF;
        v_end := v_start + (NEW.durasi_efektif || ' hours')::INTERVAL;

        SELECT COUNT(*) INTO v_conflict_count
        FROM public.bookings
        WHERE kode_unit = NEW.kode_unit
          AND status_booking IN ('Terkonfirmasi', 'Active')
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
          AND v_start <
              (tanggal_booking + jam_mulai +
               CASE WHEN jam_mulai < CASE
                   WHEN EXTRACT(ISODOW FROM tanggal_booking) IN (5, 6, 7)
                       THEN TIME '09:00'
                   ELSE TIME '10:00'
               END THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END) +
              (durasi_efektif || ' hours')::INTERVAL
          AND v_end >
              (tanggal_booking + jam_mulai +
               CASE WHEN jam_mulai < CASE
                   WHEN EXTRACT(ISODOW FROM tanggal_booking) IN (5, 6, 7)
                       THEN TIME '09:00'
                   ELSE TIME '10:00'
               END THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END);

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Bentrok jadwal! Unit % sudah memiliki booking pada tanggal % antara % dan %.',
                NEW.kode_unit, NEW.tanggal_booking, NEW.jam_mulai, NEW.jam_selesai;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_booking_conflict ON public.bookings;
CREATE TRIGGER trg_prevent_booking_conflict
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_booking_conflict();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'units'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
    END IF;
END $$;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active units" ON public.units;
CREATE POLICY "Public can view active units"
ON public.units FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view bookings schedule" ON public.bookings;
CREATE POLICY "Public can view bookings schedule"
ON public.bookings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Staff can insert bookings" ON public.bookings;
CREATE POLICY "Staff can insert bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update bookings" ON public.bookings;
CREATE POLICY "Staff can update bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can delete bookings" ON public.bookings;
CREATE POLICY "Staff can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Staff can manage units" ON public.units;
CREATE POLICY "Staff can manage units"
ON public.units FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.units (kode_unit, kode_cabang, kelas, preferensi_zona, tarif_per_jam, urutan, is_active)
VALUES
    ('VVIP5-01', 'CBG-01', 'VVIP PS5', 'Smoking | Lt 2', 35000, 1, true),
    ('VVIP5-02', 'CBG-01', 'VVIP PS5', 'Non Smoking | Lt 3', 35000, 2, true),
    ('VIP4-01', 'CBG-01', 'VIP PS4', 'Smoking | Lt 2', 25000, 3, true),
    ('VIP4-02', 'CBG-01', 'VIP PS4', 'Smoking | Lt 2', 25000, 4, true),
    ('VIP4-03', 'CBG-01', 'VIP PS4', 'Non Smoking | Lt 3', 25000, 5, true),
    ('VIP4-04', 'CBG-01', 'VIP PS4', 'Non Smoking | Lt 3', 25000, 6, true),
    ('VIP5-01', 'CBG-01', 'VIP PS5', 'Smoking | Lt 3', 30000, 7, true),
    ('VIP5-02', 'CBG-01', 'VIP PS5', 'Non Smoking | Lt 3', 30000, 8, true),
    ('REG-01', 'CBG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000, 9, true),
    ('PS3-01', 'CBG-01', 'Reguler PS3', 'Non Smoking | Lt 1', 6000, 10, true),
    ('PS3-02', 'CBG-01', 'Reguler PS3', 'Non Smoking | Lt 1', 6000, 11, true),
    ('REG-04', 'CBG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000, 12, true),
    ('REG-05', 'CBG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000, 13, true),
    ('REG-06', 'CBG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000, 14, true),
    ('REG-07', 'CBG-01', 'Reguler PS4', 'Non Smoking | Lt 1', 10000, 15, true),
    ('REG-08', 'CBG-01', 'Reguler PS4', 'Smoking | Lt 2', 10000, 16, true),
    ('REG-09', 'CBG-01', 'Reguler PS4', 'Smoking | Lt 2', 10000, 17, true),
    ('REG-10', 'CBG-01', 'Reguler PS4', 'Smoking | Lt 2', 10000, 18, true)
ON CONFLICT (kode_unit) DO UPDATE
SET kelas = EXCLUDED.kelas,
    preferensi_zona = EXCLUDED.preferensi_zona,
    tarif_per_jam = EXCLUDED.tarif_per_jam,
    urutan = EXCLUDED.urutan,
    is_active = true;

UPDATE public.units
SET is_active = false
WHERE kode_unit NOT IN (
    'VVIP5-01', 'VVIP5-02', 'VIP4-01', 'VIP4-02', 'VIP4-03', 'VIP4-04',
    'VIP5-01', 'VIP5-02', 'REG-01', 'PS3-01', 'PS3-02', 'REG-04',
    'REG-05', 'REG-06', 'REG-07', 'REG-08', 'REG-09', 'REG-10'
);
