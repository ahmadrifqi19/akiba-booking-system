# Dokumentasi Arsitektur Sistem, Alur Data (DFD), & ERD
## Akiba Core Real-Time Booking & Visual Schedule System

Dokumen ini memuat spesifikasi arsitektur teknis, diagram arsitektur tingkat tinggi (High-Level Architecture), Data Flow Diagram (DFD), Diagram Sekuensial Realtime, dan Entity Relationship Diagram (ERD) untuk sistem booking rental PlayStation **Akiba Core**.

---

## 1. High-Level System Architecture Diagram

Diagram berikut menggambarkan 3 layer utama: **Deployment & CI/CD**, **Frontend Layer (Next.js on Vercel)**, dan **Backend/Database Layer (Supabase PaaS)** beserta garis hubungan antar komponen.

```mermaid
flowchart TB
    %% Definitions of Subgraphs per Layer
    subgraph DEPLOYMENT ["Layer 1: Source Control & Deployment Infrastructure"]
        GH["GitHub Repository<br/>(Branch: main)"]
        VERCEL_INFRA["Vercel Cloud Platform<br/>(Edge & Serverless Network)"]
        ENV_VARS["Environment Variables<br/>(NEXT_PUBLIC_SUPABASE_URL<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY)"]
        GH -->|"Git Push / Webhook Auto-Deploy"| VERCEL_INFRA
        ENV_VARS -.->|"Injected to Runtime"| VERCEL_INFRA
    end

    subgraph FRONTEND ["Layer 2: Frontend Client (Next.js App Router)"]
        direction TB
        
        subgraph ROUTE_PUBLIC ["Public Module (Customer Facing)"]
            DISPLAY["/display<br/><b>Customer Schedule Board</b><br/>• Mobile-First & Desktop Grid<br/>• 7-Day Date Bar & Filter<br/>• Weekday 10:00 / Weekend 09:00 through 02:00<br/>• Public booking data: unit, customer name, source & time interval only<br/>• Read-Only (Tanpa Login)"]
        end

        subgraph ROUTE_PROTECTED ["Protected Modules (Staff & Admin Facing)"]
            KASIR["/kasir<br/><b>Kasir POS Panel</b><br/>• Wajib Role: Kasir<br/>• Quick Booking Form<br/>• Interactive Click Grid<br/>• Auto-Block Bentrok Jadwal"]
            ANALYTICS["/analytics<br/><b>Owner Analytics Dashboard</b><br/>• Wajib Role: Admin<br/>• Metrik Omzet, Jam & Trx<br/>• Grafik Peak Hours & Okupansi<br/>• Export CSV / Excel"]
        end

        CLIENT_CORE["Next.js Application Core<br/>(Supabase Client SDK / SSR / Middleware Route Guard)"]
        
        DISPLAY --- CLIENT_CORE
        KASIR --- CLIENT_CORE
        ANALYTICS --- CLIENT_CORE
    end

    subgraph BACKEND ["Layer 3: Backend & Database Engine (Supabase Cloud)"]
        direction TB
        
        AUTH["Supabase Auth Engine<br/>• JWT & Session Management<br/>• Role Verification (Kasir / Admin)"]
        
        REALTIME["Supabase Realtime Engine<br/>(Elixir Phoenix / WebSocket Server)<br/>• CDC (Change Data Capture) Listeners<br/>• Broadcast / PubSub Channels"]
        
        subgraph POSTGRES ["PostgreSQL Database Server"]
            TBL_UNITS[("Table: units<br/>Daftar Unit PS & Tarif")]
            TBL_BOOKINGS[("Table: bookings<br/>Transaksi & Jadwal Sewa")]
            WAL["Postgres Write-Ahead Log (WAL)<br/>Logical Replication"]
            
            TBL_BOOKINGS -->|"Generates Change Event"| WAL
        end

        WAL -->|"Stream Database Changes"| REALTIME
    end

    %% Cross-layer connections
    VERCEL_INFRA -->|"Hosts & Serves"| FRONTEND
    
    %% Auth Interactions
    KASIR ==>|"1. Login & Verify JWT (Kasir Role)"| AUTH
    ANALYTICS ==>|"1. Login & Verify JWT (Admin Role)"| AUTH
    
    %% Data Mutations & Queries
    KASIR ==>|"2. Insert / Update Bookings (Conflict Check)"| TBL_BOOKINGS
    ANALYTICS ==>|"2. Query Agregasi Omzet & Okupansi"| TBL_BOOKINGS
    DISPLAY ==>|"Initial SSR / Fetch Schedule Data"| TBL_BOOKINGS
    DISPLAY -.->|"Read Unit Config"| TBL_UNITS
    
    %% Realtime WebSocket Stream
    REALTIME ==>|"3. Instant WebSocket Push (Broadcast Update)"| DISPLAY

    %% Styling & Class Definitions
    classDef depLayer fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc;
    classDef feLayer fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef beLayer fill:#022c22,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef highlightBox fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef realtimeBox fill:#701a75,stroke:#f472b6,stroke-width:2px,color:#f8fafc;

    class GH,VERCEL_INFRA,ENV_VARS depLayer;
    class DISPLAY,KASIR,ANALYTICS highlightBox;
    class CLIENT_CORE feLayer;
    class AUTH,TBL_UNITS,TBL_BOOKINGS,WAL beLayer;
    class REALTIME realtimeBox;
```

---

## 2. Data Flow Diagram (DFD)

### DFD Level 0 (Context Diagram)
Diagram Konteks menggambarkan batasan sistem dan entitas eksternal yang berinteraksi langsung dengan Akiba Core System.

```mermaid
flowchart LR
    CUST["Pelanggan (Customer)<br/>[External Entity]"]
    CASHIER["Kasir Rental<br/>[External Entity]"]
    OWNER["Owner / Manajemen<br/>[External Entity]"]
    
    SYSTEM(("Akiba Core Booking<br/>& Visual Schedule System<br/>[Process 0]"))
    
    CUST -->|"Akses /display (Lihat Jadwal & Unit)"| SYSTEM
    SYSTEM -->|"Tampilan Slot Realtime & Status Ketersediaan"| CUST
    
    CASHIER -->|"Kredensial Login Kasir"| SYSTEM
    CASHIER -->|"Input Booking Dragonplay (Unit, Jam, Nama, WA)"| SYSTEM
    SYSTEM -->|"Validasi Bentrok & Status Bayar di Kasir"| CASHIER
    
    OWNER -->|"Kredensial Login Admin"| SYSTEM
    OWNER -->|"Filter Periode Laporan"| SYSTEM
    SYSTEM -->|"Laporan Metrik, Grafik Okupansi, Ekspor Data"| OWNER

    classDef entity fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;
    classDef process fill:#0369a1,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    class CUST,CASHIER,OWNER entity;
    class SYSTEM process;
```

---

### DFD Level 1 (Decomposition Diagram)
Menjelaskan aliran data terperinci di antara proses, data store, dan entitas.

```mermaid
flowchart TD
    %% Entities
    CUST["Pelanggan (Customer)"]
    CASHIER["Kasir"]
    OWNER["Owner / Admin"]

    %% Processes
    P_AUTH["1.0 Autentikasi & Autorisasi<br/>(Supabase Auth)"]
    P_DISPLAY["2.0 Visualisasi Jadwal Realtime<br/>(/display)"]
    P_BOOKING["3.0 Pengelolaan Booking & Validasi Jadwal<br/>(/kasir)"]
    P_ANALYTICS["4.0 Agregasi Data & Analisis Bisnis<br/>(/analytics)"]
    P_BROADCAST["5.0 Realtime CDC Engine<br/>(Supabase Realtime)"]

    %% Data Stores
    DS_UNITS[("D1: units")]
    DS_BOOKINGS[("D2: bookings")]

    %% Flows - Auth
    CASHIER -->|"Form Login (Email & Password)"| P_AUTH
    OWNER -->|"Form Login (Email & Password)"| P_AUTH
    P_AUTH -->|"Token JWT & Role Kasir"| CASHIER
    P_AUTH -->|"Token JWT & Role Admin"| OWNER

    %% Flows - Kasir Booking
    CASHIER -->|"Submit Form Booking Baru"| P_BOOKING
    P_BOOKING <-->|"Cek Overlap Jadwal (Jam Mulai - Jam Selesai)"| DS_BOOKINGS
    P_BOOKING -->|"Ambil Tarif & Info Unit"| DS_UNITS
    P_BOOKING -->|"Simpan Record Booking Baru"| DS_BOOKINGS
    P_BOOKING -->|"Notifikasi Sukses / Error Bentrok"| CASHIER

    %% Flows - Realtime Trigger
    DS_BOOKINGS -->|"Event INSERT / UPDATE / DELETE"| P_BROADCAST
    P_BROADCAST ==>|"WebSocket Push Event"| P_DISPLAY

    %% Flows - Customer Display
    CUST -->|"Buka URL /display (Pilih Tanggal)"| P_DISPLAY
    P_DISPLAY <-->|"Initial Query Daftar Unit"| DS_UNITS
    P_DISPLAY <-->|"Initial Query Jadwal Terisi"| DS_BOOKINGS
    P_DISPLAY -->|"Render Visual Timeline (opening through 02:00)"| CUST

    %% Flows - Analytics
    OWNER -->|"Request Laporan & Filter Tanggal"| P_ANALYTICS
    P_ANALYTICS <-->|"Query Agregasi Total Omzet, Jam Main, Trx"| DS_BOOKINGS
    P_ANALYTICS -->|"Visualisasi Grafik & Download CSV"| OWNER

    classDef entity fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;
    classDef process fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#f8fafc;
    classDef dstore fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;

    class CUST,CASHIER,OWNER entity;
    class P_AUTH,P_DISPLAY,P_BOOKING,P_ANALYTICS,P_BROADCAST process;
    class DS_UNITS,DS_BOOKINGS dstore;
```

---

### Real-Time Data Flow Sequence Diagram
Mengilustrasikan bagaimana proses booking di `/kasir` memicu update seketika pada tampilan `/display` pelanggan melalui Supabase Realtime WebSocket:

```mermaid
sequenceDiagram
    autonumber
    actor Kasir as Kasir (/kasir)
    participant NextClient as Next.js POS Client
    participant SupaAuth as Supabase Auth
    participant SupaDB as PostgreSQL ('bookings')
    participant SupaRT as Supabase Realtime
    participant CustDisplay as Customer Screen (/display)

    Note over CustDisplay,SupaRT: Customer /display standby & mendengarkan channel WebSocket
    CustDisplay->>SupaRT: Subscribe channel ('public:bookings')
    SupaRT-->>CustDisplay: Subscription Terkonfirmasi (Active)

    Note over Kasir,SupaDB: Kasir Memproses Booking Baru
    Kasir->>NextClient: Input Data Booking & Klik Submit
    NextClient->>SupaAuth: Verifikasi Active Session & Role Kasir
    SupaAuth-->>NextClient: Session Valid (Kasir Authorized)
    
    NextClient->>SupaDB: SELECT overlaps WHERE unit = X AND tgl = Y AND time_range overlap
    alt Ada Jadwal Bentrok
        SupaDB-->>NextClient: Return existing overlapping record
        NextClient-->>Kasir: Alert Error: "Slot Jadwal Sudah Terisi!"
    else Slot Kosong (Tervalidasi)
        NextClient->>SupaDB: INSERT INTO bookings (..., status_booking='Terkonfirmasi')
        SupaDB-->>NextClient: 201 Created (Success)
        NextClient-->>Kasir: Notifikasi "Booking Berhasil Disimpan"
        
        Note over SupaDB,SupaRT: Mekanisme CDC (Change Data Capture)
        SupaDB->>SupaRT: WAL Notification: INSERT on bookings
        SupaRT->>CustDisplay: WebSocket Broadcast: event INSERT payload
        CustDisplay->>CustDisplay: Update State Grid Lokal (Slot Berubah Menjadi Kuning/Merah)
    end
```

---

## 3. Entity Relationship Diagram (ERD)

Database menggunakan PostgreSQL pada Supabase. Relasi antar tabel dirancang untuk menjaga integritas referensial dan performa agregasi query analytics.

```mermaid
erDiagram
    auth_users ||--o{ bookings : "handles / creates"
    units ||--o{ bookings : "reserved in"

    auth_users {
        uuid id PK "User ID Supabase Auth"
        varchar email "Email login operator/admin"
        varchar role "Role (kasir / admin)"
        timestamp created_at "Waktu pendaftaran"
    }

    units {
        varchar kode_unit PK "Kode unik unit (misal: PS5-01, PS4-VIP-01)"
        varchar kode_cabang "Kode cabang rental"
        varchar kelas "Tipe/Kelas (Reguler, VIP, VVIP)"
        varchar preferensi_zona "Zona (Smoking, Non-Smoking, Sofa Lounge)"
        numeric tarif_per_jam "Tarif rental dasar per jam"
        timestamp created_at "Timestamp pembuatan data"
    }

    bookings {
        bigserial id PK "Primary Key (Auto-increment / UUID)"
        timestamptz timestamp_input "Waktu kasir menginput data"
        varchar kode_cabang "Identifikasi cabang"
        date tanggal_booking "Tanggal sewa main (YYYY-MM-DD)"
        time jam_mulai "Jam mulai sewa (weekday 10:00 / weekend 09:00 through 02:00)"
        time jam_selesai "Jam selesai sewa"
        numeric durasi_efektif "Durasi bermain (dalam jam)"
        varchar nama_pelanggan "Nama lengkap penyewa"
        varchar no_whatsapp "Kontak aktif WhatsApp"
        varchar kode_unit FK "Foreign Key merujuk ke units.kode_unit"
        numeric biaya_main "Total biaya sewa durasi main"
        numeric total "Total sewa (durasi_efektif * tarif_per_jam)"
        varchar status_pembayaran "Belum Bayar / Lunas (Bayar di Kasir)"
        varchar status_booking "Terkonfirmasi, Active, Selesai, Batal"
        varchar sumber_booking "Dragonplay, WhatsApp, Walk-in"
        varchar operator_kasir "Nama operator kasir, privat"
        uuid operator_id FK "Foreign Key merujuk ke auth.users.id"
        text catatan "Catatan internal operator, tidak ditampilkan publik"
    }
```

---

## 4. Spesifikasi Kamus Data (Data Dictionary)

### Tabel 1: `units`
Tabel master untuk mengelola unit konsol PlayStation yang disewakan.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `kode_unit` | `VARCHAR(30)` | **PRIMARY KEY** | Identifier unik unit (contoh: `PS5-VIP-01`). |
| `kode_cabang` | `VARCHAR(20)` | `NOT NULL` | Kode identitas cabang operasional. |
| `kelas` | `VARCHAR(30)` | `NOT NULL` | Kategori konsol (`PS5 Standard`, `PS5 VIP`, `PS4 Pro`). |
| `preferensi_zona` | `VARCHAR(50)` | `NOT NULL` | Ruangan (`VIP Room AC`, `Smoking Area`, `Non-Smoking`). |
| `tarif_per_jam` | `NUMERIC(10,2)` | `NOT NULL, CHECK (tarif_per_jam > 0)` | Harga sewa per jam. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu data dibuat. |

---

### Tabel 2: `bookings`
Tabel transaksi utama yang menyimpan jadwal dan rincian finansial sewa.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` / `UUID` | **PRIMARY KEY** | Identifier transaksi unik. |
| `timestamp_input` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Waktu saat form disubmit di POS kasir. |
| `kode_cabang` | `VARCHAR(20)` | `NOT NULL` | Cabang lokasi booking. |
| `tanggal_booking` | `DATE` | `NOT NULL` | Tanggal reservasi. |
| `jam_mulai` | `TIME` | `NOT NULL` | Waktu mulai sewa (misal: `14:00:00`). |
| `jam_selesai` | `TIME` | `NOT NULL` | Waktu selesai sewa (misal: `16:00:00`). |
| `durasi_efektif` | `NUMERIC(4,2)` | `NOT NULL` | Lama main dalam jam (misal: `2.00`). |
| `nama_pelanggan` | `VARCHAR(100)` | `NOT NULL` | Nama penyewa. |
| `no_whatsapp` | `VARCHAR(25)` | `NOT NULL` | Nomor kontak WhatsApp pelanggan. |
| `kode_unit` | `VARCHAR(30)` | **FOREIGN KEY** | Terhubung ke `units.kode_unit` (`ON DELETE RESTRICT`). |
| `biaya_main` | `NUMERIC(12,2)` | `NOT NULL` | `durasi_efektif` $\times$ `tarif_per_jam`. |
| `total` | `NUMERIC(12,2)` | `NOT NULL` | Nilai sewa saja: `durasi_efektif × tarif_per_jam`. |
| `status_pembayaran` | `VARCHAR(40)` | `CHECK IN ('Belum Bayar', 'Lunas (Bayar di Kasir)')` | Pembayaran dilakukan langsung di kasir. |
| `status_booking` | `VARCHAR(20)` | `CHECK IN ('Terkonfirmasi', 'Active', 'Selesai', 'Batal')` | Status sesi rental. |
| `sumber_booking` | `VARCHAR(30)` | `CHECK IN ('Dragonplay', 'WhatsApp', 'Walk-in')` | Kanal sumber reservasi. |
| `operator_kasir` | `VARCHAR(30)` | Wajib untuk booking baru | Nama operator kasir; hanya ditampilkan di detail internal. |
| `operator_id` | `UUID` | **FOREIGN KEY** | Kasir pencatat transaksi (merujuk ke `auth.users.id`). |
| `catatan` | `TEXT` | `NULL` | Catatan internal, hanya dapat dilihat operator. |

---

## 5. Ringkasan Fitur & Logika Validasi

1. **Smart Validation (Pencegahan Overlap Jadwal)**:
   - Sebelum record disimpan ke tabel `bookings`, sistem mengeksekusi query validasi bentrok:
   ```sql
   SELECT id FROM bookings
   WHERE kode_unit = :kode_unit
     AND tanggal_booking = :tanggal_booking
     AND status_booking IN ('Terkonfirmasi', 'Active')
     AND (
       (jam_mulai < :jam_selesai AND jam_selesai > :jam_mulai)
     );
   ```
   - Jika record ditemukan, transaksi ditolak dan kasir menerima notifikasi instan.

2. **Supabase Realtime Replication Config**:
   - Tabel `bookings` ditambahkan ke publication Supabase Realtime:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
   ```
   - Client `/display` mendengarkan event via:
   ```typescript
   supabase
     .channel('public:bookings')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
       updateTimelineGrid(payload);
     })
     .subscribe();
   ```

3. **Color-Coded Status di `/display`**:
   - 🟢 **Kosong (Available)**: Tidak ada booking pada rentang slot jam tersebut.
   - 🔵 **Terkonfirmasi**: Terjadwal untuk waktu mendatang.
   - 🟢 **Active (Sedang Main)**: Waktu sekarang berada di antara `jam_mulai` dan `jam_selesai`.
   - ⚪ **Selesai**: Sesi main telah berakhir.
