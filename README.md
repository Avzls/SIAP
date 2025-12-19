# SIAP - Sistem Informasi Aset Perusahaan

SIAP adalah aplikasi Manajemen Aset (Asset Management System) internal yang dirancang untuk mengelola inventaris perusahaan secara efisien, mulai dari pengadaan, peminjaman, perbaikan, hingga penghapusan aset. Sistem ini terintegrasi langsung dengan database HRIS untuk sinkronisasi data karyawan secara otomatis.

## 🚀 Fitur Utama

### Manajemen Aset
- **Dashboard Real-time**: Ringkasan status aset dan aktivitas terbaru
- **Inventaris Lengkap**: Kategori, lokasi, dan riwayat pergerakan (Audit Trail)
- **Import CSV**: Import banyak aset sekaligus dengan template standar
- **Lampiran Aset**: Upload foto dan dokumen pendukung
- **QR Code Label**: Cetak label QR untuk identifikasi aset

### Self-Service & Workflow
- **Request Aset**: Karyawan dapat mengajukan permintaan aset, perbaikan, atau pengembalian
- **Workflow Approval**: Alur persetujuan bertingkat dari Manager hingga Admin Aset
- **Fulfillment Dashboard**: Admin mengelola pemenuhan request yang disetujui
- **Notifikasi In-App**: Pemberitahuan real-time untuk approval dan status request

### Administrasi
- **HRIS Sync**: Otomasi data karyawan dari database SQL Server HRIS
- **Role Management**: Role-based access control (RBAC) dengan Spatie Permission
- **Laporan**: Report aset, pergerakan, dan permintaan dengan filter

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12
- **Database Utama**: MySQL (Data Aset & Aplikasi)
- **Database Eksternal**: SQL Server (Sinkronisasi HRIS)
- **Authentication**: Laravel Sanctum (Token-based)
- **Role Management**: Spatie Laravel-Permission

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)

---

## ⚙️ Instalasi

### Prasyarat
- PHP 8.3+
- Node.js 20+
- Composer
- MySQL Server

### 1. Persiapan Backend
```bash
# Masuk ke folder root
cd SIAP

# Install dependensi
composer install

# Copy .env dan sesuaikan database
cp .env.example .env
php artisan key:generate

# Jalankan migrasi dan seeder awal
php artisan migrate --seed

# Jalankan server
php artisan serve
```

**Konfigurasi HRIS (Opsional):**
Update di `.env`:
- `HRISDB_HOST`: Host SQL Server
- `HRISDB_DATABASE`: Nama database HRIS
- Jalankan sync: `php artisan hris:sync-users`

### 2. Persiapan Frontend
```bash
# Masuk ke folder frontend
cd frontend

# Install dependensi
npm install

# Jalankan mode development
npm run dev
```

Frontend berjalan di `http://localhost:3000`
Backend API di `http://localhost:8000`

---

## 📥 Import Aset via CSV

SIAP mendukung import aset secara bulk menggunakan file CSV.

### Format Template
| Kolom | Wajib | Deskripsi |
|-------|-------|-----------|
| asset_tag | Tidak | Tag aset (auto-generate jika kosong) |
| name | **Ya** | Nama aset |
| category_code | **Ya** | Kode kategori (harus sudah ada) |
| location_code | Tidak | Kode lokasi |
| brand | Tidak | Merek |
| model | Tidak | Model |
| serial_number | Tidak | Nomor seri |
| purchase_date | Tidak | Format YYYY-MM-DD |
| purchase_price | Tidak | Harga pembelian |
| warranty_end | Tidak | Tanggal garansi berakhir |
| notes | Tidak | Catatan |

Download template: `GET /api/assets/import/template`

---

## 🔐 Akun Demo

Password default: `password123`

| No. Pegawai | Nama | Role | Akses Utama |
|-------------|------|------|-------------|
| **SPA001** | Super Admin | Super Admin | Full system access |
| **ADM001** | Admin Asset | Asset Admin | Kelola aset & pemenuhan request |
| **MGR001** | Manager | Approver | Menyetujui/Menolak request |
| **EMP001** | Employee | Employee | Input request aset |

---

## 📂 Struktur Folder

```
SIAP/
├── app/                    # Laravel Backend
│   ├── Http/Controllers/   # API Controllers
│   ├── Models/             # Eloquent Models
│   ├── Services/           # Business Logic
│   └── Enums/              # Status Enums
├── routes/
│   └── api.php             # API Routes
├── database/
│   ├── migrations/         # Database Migrations
│   └── seeders/            # Database Seeders
├── frontend/               # Next.js Frontend
│   ├── src/app/            # App Router Pages
│   ├── src/components/     # UI Components
│   ├── src/lib/            # API & Utilities
│   └── src/stores/         # Zustand Stores
└── storage/
    └── app/attachments/    # Asset Attachments
```

---

## 📄 Lisensi

Sistem ini dikembangkan secara internal untuk kebutuhan manajemen aset perusahaan.
