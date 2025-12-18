# SIAP - Sistem Informasi Aset Perusahaan

SIAP adalah aplikasi Manajemen Aset (Asset Management System) internal yang dirancang untuk mengelola inventaris perusahaan secara efisien, mulai dari pengadaan, peminjaman, perbaikan, hingga penghapusan aset. Sistem ini terintegrasi langsung dengan database HRIS untuk sinkronisasi data karyawan secara otomatis.

## 🚀 Fitur Utama

- **Dashboard Real-time**: Ringkasan status aset dan aktivitas terbaru.
- **Manajemen Aset**: Inventaris lengkap dengan kategori, lokasi, dan riwayat pergerakan (Audit Trail).
- **Self-Service Request**: Karyawan dapat mengajukan permintaan aset, perbaikan, atau pengembalian melalui aplikasi.
- **Workflow Approval**: Alur persetujuan bertingkat dari Manager hingga Admin Aset.
- **HRIS Sync**: Otomasi data karyawan dari database SQL Server HRIS.
- **Keamanan**: Autentikasi menggunakan No. Pegawai dan Password dengan role-based access control (RBAC).

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12
- **Database Utama**: MySQL (Data Aset & Aplikasi)
- **Database Eksternal**: SQL Server (Sinkronisasi HRIS)
- **Authentication**: Laravel Sanctum (Token-based)
- **Role Management**: Spatie Laravel-Permission

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React

---

## ⚙️ Instalasi

### Prasyarat
- PHP 8.3+
- Node.js 20+
- Composer
- Laragon / XAMPP / MySQL Server

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
```

**Konfigurasi HRIS (Jika perlu sync):**
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

---

## 🔐 Akun Demo

Gunakan kredensial berikut untuk mencoba berbagai Role (Password default: `password123`):

| No. Pegawai | Nama | Role | Akses Utama |
|-------------|------|------|-------------|
| **ADM001** | Admin Asset | Asset Admin | Kelola aset & pemenuhan request |
| **MGR001** | Manager | Approver | Menyetujui/Menolak request |
| **EMP001** | Employee | Employee | Input Request aset |
| **SPA001** | Super Admin | Super Admin | Full system access |

---

## 📂 Struktur Folder
- `/app`, `/routes`, `/database`: Laravel Backend logic.
- `/frontend`: Next.js Frontend application.
- `/docker`: Konfigurasi deployment kontainer.

---

## 📄 Lisensi
Sistem ini dikembangkan secara internal untuk kebutuhan manajemen aset perusahaan.
