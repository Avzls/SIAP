# PANDUAN PENGGUNA SIAP
## Sistem Informasi Aset Perusahaan

**Versi:** 1.0  
**Terakhir Diperbarui:** 19 Desember 2025

---

# Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Memulai](#memulai)
3. [Role & Hak Akses](#role--hak-akses)
4. [Fitur Utama](#fitur-utama)
5. [Panduan Per Role](#panduan-per-role)
6. [FAQ & Troubleshooting](#faq--troubleshooting)

---

# Pendahuluan

## Tentang SIAP

SIAP (Sistem Informasi Aset Perusahaan) adalah aplikasi manajemen aset yang membantu perusahaan mengelola inventaris dari pengadaan hingga penghapusan aset. Sistem ini dirancang untuk:

- Melacak lokasi dan status aset secara real-time
- Mempermudah proses permintaan dan persetujuan aset
- Mencatat riwayat perpindahan aset (audit trail)
- Mengelola pemeliharaan dan perbaikan aset
- Menghasilkan laporan manajemen aset

## Kebutuhan Sistem

- Browser modern (Chrome, Firefox, Edge, Safari)
- Koneksi internet stabil
- Resolusi layar minimal 1366x768

---

# Memulai

## Login ke Sistem

1. Buka browser dan akses URL aplikasi SIAP
2. Masukkan **No. Pegawai** dan **Password** Anda
3. Klik tombol **Login**

### Akun Demo (untuk testing)

| No. Pegawai | Password | Role |
|-------------|----------|------|
| SA001 | password | Super Admin |
| AA001 | password | Asset Admin |
| AP001 | password | Approver |
| EM001 | password | Employee |

### Lupa Password?

Hubungi Administrator IT untuk reset password.

## Navigasi Utama

Setelah login, Anda akan melihat:

- **Sidebar Kiri**: Menu navigasi utama
- **Header**: Notifikasi dan profil user
- **Dashboard**: Overview status aset dan aktivitas

### Menu Utama

- **Beranda**: Dashboard ringkasan
- **Aset**: Daftar dan detail aset
- **Permintaan Saya**: Request yang Anda buat
- **Persetujuan**: Request yang perlu disetujui (Approver only)
- **Pemenuhan**: Request yang perlu dipenuhi (Admin only)
- **Stock Opname**: Audit fisik aset (Admin only)
- **Maintenance**: Jadwal pemeliharaan (Admin only)
- **Laporan**: Reports dan export (Admin only)
- **Master Data**: Kategori & Lokasi (Admin only)
- **Admin**: User & Role management (Super Admin only)

---

# Role & Hak Akses

## 1. Employee (Karyawan)

**Hak Akses:**
- ✅ Lihat daftar aset
- ✅ Lihat detail aset
- ✅ Buat permintaan aset baru
- ✅ Lihat permintaan sendiri
- ✅ Update/batalkan permintaan (status Draft)
- ✅ Lihat notifikasi

**Tidak Bisa:**
- ❌ Edit/hapus aset
- ❌ Setujui permintaan
- ❌ Akses laporan lengkap
- ❌ Kelola master data

## 2. Approver (Manager/Penyetuju)

**Hak Akses:**
- ✅ Semua akses Employee
- ✅ Lihat daftar permintaan yang perlu persetujuan
- ✅ Menyetujui permintaan
- ✅ Menolak permintaan

## 3. Asset Admin (Admin Aset)

**Hak Akses:**
- ✅ Semua akses Employee & Approver
- ✅ CRUD (Create, Read, Update, Delete) aset
- ✅ Assign aset ke user
- ✅ Return aset ke stok
- ✅ Transfer aset antar user/lokasi
- ✅ Retire/dispose aset
- ✅ Upload/delete lampiran aset
- ✅ Import aset via CSV
- ✅ Fulfill permintaan yang sudah disetujui
- ✅ Stock opname/audit
- ✅ Maintenance management
- ✅ Generate & export laporan
- ✅ Kelola kategori & lokasi

## 4. Super Admin

**Hak Akses:**
- ✅ **Full access** ke semua fitur
- ✅ Kelola user (CRUD, assign role)
- ✅ Kelola role & permissions

---

# Fitur Utama

## 1. Dashboard

Dashboard menampilkan overview sistem:

- **Total Aset**: Jumlah total aset dalam sistem
- **Total Nilai**: Total nilai aset
- **Garansi Segera Habis**: Aset dengan garansi < 30 hari
- **Status Aset**: Breakdown aset per status (Tersedia, Digunakan, Perbaikan, dll)
- **Kategori**: Jumlah aset per kategori
- **Lokasi**: Distribusi aset per lokasi
- **Recent Activity**: Aktivitas terbaru

## 2. Manajemen Aset

### Melihat Daftar Aset

1. Klik menu **Aset** di sidebar
2. Gunakan **Search** untuk mencari aset tertentu
3. Filter berdasarkan **Status** (Tersedia, Digunakan, dll)
4. Klik aset untuk melihat detail

### Melihat Detail Aset

Detail aset terdiri dari beberapa tab:

#### Tab Overview
- Informasi umum (Asset Tag, Nama, Kategori)
- Status dan pemegang saat ini
- Spesifikasi teknis
- Informasi pembelian (harga, tanggal, garansi)
- QR Code (untuk scanning)

#### Tab History
- Riwayat perpindahan aset
- Tanggal, tipe pergerakan, user, dan catatan

#### Tab Attachments
- Dokumen terkait aset (invoice, foto, manual)
- Upload/download lampiran

#### Tab Depreciation
- Grafik depresiasi nilai aset
- Tabel nilai buku per tahun

### Membuat Aset Baru (Admin)

1. Klik menu **Aset** → tombol **+ Tambah Aset**
2. Isi form:
   - **Asset Tag**: Kode unik aset (auto-generate)
   - **Nama**: Nama aset
   - **Kategori**: Pilih kategori
   - **Brand**: Merk aset
   - **Model**: Model/tipe
   - **Serial Number**: Nomor seri (optional)
   - **Lokasi Awal**: Lokasi penyimpanan
   - **Tanggal Pembelian**: Tanggal beli
   - **Harga Pembelian**: Harga beli
   - **Masa Manfaat (tahun)**: Untuk kalkulasi depresiasi
   - **Nilai Sisa**: Nilai akhir setelah masa manfaat
   - **Garansi Berakhir**: Tanggal akhir garansi (optional)
   - **Catatan**: Informasi tambahan (optional)
3. Klik **Simpan**

### Assign Aset ke User (Admin)

1. Buka detail aset (status harus "Tersedia")
2. Klik tombol **Tetapkan**
3. Pilih **User** yang akan menerima aset
4. Pilih **Lokasi** penempatan
5. Tambahkan **Catatan** (optional)
6. Klik **Tetapkan Aset**

### Return Aset ke Stok (Admin)

1. Buka detail aset (status harus "Digunakan")
2. Klik tombol **Kembalikan**
3. Pilih **Lokasi** penyimpanan
4. Tambahkan **Catatan** (optional)
5. Klik **Kembalikan Aset**

### Pindah Lokasi Aset (Admin)

1. Buka detail aset
2. Klik **Ubah Lokasi**
3. Pilih **Lokasi Baru**
4. Tambahkan **Catatan** (optional)
5. Klik **Simpan**

### Transfer Aset Antar User (Admin)

1. Buka detail aset (status harus "Digunakan")
2. Klik **More Actions** → **Transfer**
3. Pilih **User Baru**
4. Pilih **Lokasi Baru** (optional)
5. Tambahkan **Catatan** (optional)
6. Klik **Transfer**

### Retire/Disposal Aset (Admin)

1. Buka detail aset
2. Klik **More Actions** → **Retire Asset**
3. Pilih **Alasan**:
   - Rusak Berat
   - Kadaluarsa
   - Tidak Ekonomis
   - Dijual
   - Lainnya
4. Tambahkan **Catatan**
5. Klik **Retire Aset**

### Laporkan Aset Hilang (Admin)

1. Buka detail aset
2. Klik **More Actions** → **Report Lost**
3. Tambahkan **Catatan** (kapan/dimana hilang)
4. Klik **Laporkan Hilang**

### Tandai Aset Ditemukan (Admin)

1. Buka detail aset (status harus "Lost")
2. Klik **More Actions** → **Mark Found**
3. Pilih **Lokasi** ditemukan
4. Tambahkan **Catatan**
5. Klik **Tandai Ditemukan**

### Upload Lampiran (Admin)

1. Buka detail aset → tab **Attachments**
2. Klik **Upload File**
3. Pilih file dari komputer
4. Klik **Upload**

File yang diizinkan: PDF, DOCX, XLSX, JPG, PNG (max 10MB)

### Import Aset via CSV (Admin)

1. Klik menu **Aset** → tombol **Import CSV**
2. Download template CSV (klik "Download Template")
3. Isi data aset di template
4. Upload file CSV
5. Review preview data
6. Klik **Import**

**Format CSV:**
- asset_tag, name, category_id, brand, model, serial_number, purchase_date, purchase_price, current_location_id

## 3. Permintaan Aset

### Membuat Permintaan Baru (Employee)

1. Klik menu **Permintaan Saya** → **+ Buat Permintaan**
2. Pilih **Tipe Permintaan**:
   - **Aset Baru**: Request aset baru
   - **Perbaikan**: Request perbaikan aset
   - **Pengembalian**: Return aset yang dipinjam
3. Tambahkan **Item**:
   - Untuk Aset Baru: Pilih kategori dan jumlah
   - Untuk Perbaikan: Pilih aset dan jelaskan masalah
   - Untuk Pengembalian: Pilih aset yang akan dikembalikan
4. Tambahkan **Catatan** (optional)
5. Klik **Simpan sebagai Draft** atau **Submit untuk Persetujuan**

### Mengedit Permintaan (Employee)

1. Buka **Permintaan Saya**
2. Klik permintaan dengan status **Draft**
3. Edit detail yang diperlukan
4. Klik **Update** atau **Submit**

### Membatalkan Permintaan (Employee)

1. Buka **Permintaan Saya**
2. Klik permintaan yang ingin dibatalkan
3. Klik **Cancel Request**
4. Konfirmasi pembatalan

## 4. Persetujuan (Approver)

### Menyetujui Permintaan

1. Klik menu **Persetujuan**
2. Lihat daftar permintaan **Pending Approval**
3. Klik permintaan untuk melihat detail
4. Review item yang diminta dan catatan
5. Klik **Approve**
6. Tambahkan catatan (optional)
7. Klik **Setujui Permintaan**

### Menolak Permintaan

1. Buka detail permintaan
2. Klik **Reject**
3. **Wajib** tambahkan alasan penolakan
4. Klik **Tolak Permintaan**

## 5. Pemenuhan Request (Admin)

### Memenuhi Permintaan Aset Baru

1. Klik menu **Pemenuhan**
2. Pilih permintaan dengan status **Approved**
3. Klik **Fulfill**
4. Untuk setiap item:
   - Pilih **Aset** yang akan diberikan
   - Atau tandai "Belum tersedia" jika stok habis
5. Klik **Penuhi Permintaan**

### Memenuhi Permintaan Perbaikan

1. Pilih permintaan perbaikan
2. Klik **Fulfill Repair**
3. Update status perbaikan
4. Tambahkan catatan hasil perbaikan
5. Klik **Selesai**

## 6. Stock Opname/Audit (Admin)

Stock Opname adalah proses verifikasi fisik aset di lokasi tertentu.

### Membuat Sesi Audit Baru

1. Klik menu **Stock Opname** → **+ Buat Audit Baru**
2. Pilih **Lokasi** yang akan diaudit
3. Tambahkan **Catatan** (optional)
4. Klik **Buat Sesi Audit**

### Scan Aset

1. Buka sesi audit yang aktif
2. Gunakan scanner/kamera untuk scan **QR Code** di aset
3. Atau ketik **Asset Tag** manual lalu Enter
4. Sistem akan mencatat aset sebagai "Found"
5. Ulangi untuk semua aset di lokasi

### Status Hasil Scan

- **✅ Found**: Aset ditemukan di lokasi yang benar
- **⚠️ Missing**: Aset seharusnya di lokasi ini tapi tidak ditemukan
- **❓ Unexpected**: Aset ditemukan tapi tidak seharusnya di lokasi ini

### Finalisasi Audit

1. Setelah semua aset di-scan
2. Review hasil: Found, Missing, Unexpected
3. Klik **Finalize Audit**
4. Sistem akan update status aset otomatis

### Batalkan Audit

Jika audit perlu dibatalkan:
1. Buka sesi audit
2. Klik **Cancel Audit**
3. Konfirmasi pembatalan

## 7. Maintenance (Admin)

### Membuat Jadwal Maintenance

1. Klik menu **Maintenance** → tab **Schedules**
2. Klik **+ Jadwal Baru**
3. Isi form:
   - **Aset**: Pilih aset
   - **Tanggal**: Tanggal maintenance
   - **Tipe**: Rutin/Preventif/Darurat
   - **Catatan**: Detail pekerjaan
4. Klik **Buat Jadwal**

### Log Maintenance

1. Tab **Logs** → **+ Log Baru**
2. Pilih **Aset**
3. Isi **Hasil Maintenance**
4. Tambahkan **Biaya** (optional)
5. Klik **Simpan Log**

## 8. Laporan (Admin)

### Laporan Ringkasan Aset

Menampilkan:
- Total aset per kategori
- Total aset per lokasi
- Distribusi status
- Total nilai aset
- Garansi yang akan habis

### Laporan Pergerakan

Menampilkan riwayat:
- Tanggal pergerakan
- Tipe (Assign, Return, Transfer, dll)
- Aset yang bergerak
- User terkait

**Filter:**
- Dari Tanggal - Sampai Tanggal
- Tipe Pergerakan

### Laporan Permintaan

Menampilkan:
- Nomor permintaan
- Pemohon
- Tipe & Status
- Tanggal dibuat dan disetujui

**Filter:**
- Dari Tanggal - Sampai Tanggal
- Status (Draft, Submitted, Approved, dll)

### Export Laporan

Setiap laporan bisa di-export:

**Format Excel (CSV):**
1. Klik **Export Excel**
2. File CSV akan terdownload
3. Buka dengan Excel/LibreOffice/Google Sheets

**Format PDF (HTML):**
1. Klik **Export PDF**
2. File HTML akan terdownload
3. Buka file HTML di browser
4. **Print** (Ctrl+P)
5. Pilih **Save as PDF**
6. Simpan file PDF

## 9. Master Data (Admin)

### Kategori Aset

Mengelola kategori aset (Laptop, Monitor, Kendaraan, dll)

**Tambah Kategori:**
1. Menu **Master Data** → **Kategori** → **+ Tambah**
2. Isi nama dan kode kategori
3. Klik **Simpan**

**Edit/Hapus:**
- Klik kategori → **Edit** atau **Hapus**

### Lokasi Aset

Mengelola lokasi penyimpanan aset

**Tambah Lokasi:**
1. Menu **Master Data** → **Lokasi** → **+ Tambah**
2. Isi nama, kode, dan alamat
3. Klik **Simpan**

## 10. Admin Panel (Super Admin)

### Kelola Pengguna

**Tambah User:**
1. Menu **Admin** → **Kelola Pengguna** → **+ Tambah**
2. Isi data user (No. Pegawai, Nama, Email)
3. Set password
4. Assign role
5. Klik **Simpan**

**Edit/Hapus User:**
- Klik user → **Edit** atau **Hapus**

**Assign Role:**
- Klik user → **Assign Role**
- Pilih role baru
- Klik **Update**

### Kelola Role

**Buat Role Baru:**
1. Menu **Admin** → **Kelola Role** → **+ Tambah**
2. Isi nama role
3. Pilih permissions
4. Klik **Simpan**

**Edit Permissions:**
- Klik role → **Edit Permission**
- Centang/uncheck permissions
- Klik **Update**

---

# Panduan Per Role

## Panduan untuk Employee

### Skenario 1: Minta Laptop Baru

1. Login dengan akun Employee
2. Dashboard → **Permintaan Saya** → **+ Buat Permintaan**
3. Tipe: **Aset Baru**
4. Tambah Item:
   - Kategori: **Laptop**
   - Jumlah: **1**
   - Catatan: "Untuk keperluan kerja project X"
5. Klik **Submit untuk Persetujuan**
6. Tunggu notifikasi dari Approver

### Skenario 2: Lapor Laptop Rusak

1. **Permintaan Saya** → **+ Buat Permintaan**
2. Tipe: **Perbaikan**
3. Pilih aset laptop yang rusak
4. Jelaskan masalah: "Layar tidak menyala"
5. **Submit**

### Skenario 3: Return Aset Pinjaman

1. **Permintaan Saya** → **+ Buat Permintaan**
2. Tipe: **Pengembalian**
3. Pilih aset yang mau dikembalikan
4. Catatan: "Sudah selesai pakai"
5. **Submit**

## Panduan untuk Approver

### Skenario 1: Approve Request Karyawan

1. Login sebagai Approver
2. Notifikasi muncul → Klik atau buka **Persetujuan**
3. Lihat list request **Pending Approval**
4. Klik request untuk review detail
5. Cek kelayakan permintaan
6. Klik **Approve** → **Setujui Permintaan**

### Skenario 2: Reject Request

1. Buka request yang questionable
2. Klik **Reject**
3. Tulis alasan: "Budget tidak tersedia bulan ini"
4. **Tolak Permintaan**

## Panduan untuk Asset Admin

### Skenario 1: Fulfill Request yang Sudah Approved

1. Login sebagai Asset Admin
2. Menu **Pemenuhan**
3. Pilih request dengan status **Approved**
4. Klik **Fulfill**
5. Pilih aset dari stok untuk diberikan
6. **Penuhi Permintaan**
7. Aset otomatis ter-assign ke pemohon

### Skenario 2: Stock Opname Bulanan

1. Menu **Stock Opname** → **+ Buat Audit**
2. Lokasi: **Head Office - Floor 1**
3. **Buat Sesi Audit**
4. Bawa scanner/tablet ke lokasi
5. Scan QR code setiap aset yang ditemukan
6. Review hasil: ada yang missing?
7. **Finalize Audit**
8. Generate report

### Skenario 3: Tambah Aset Baru dari Pembelian

1. Menu **Aset** → **+ Tambah Aset**
2. Isi semua data aset dari invoice
3. Upload lampiran (invoice PDF)
4. **Simpan**
5. Print QR code label
6. Tempel label di aset fisik

### Skenario 4: Import Banyak Aset Sekaligus

1. **Aset** → **Import CSV**
2. Download template
3. Isi 50 data laptop baru di Excel
4. Upload CSV
5. Preview → **Import**
6. Print semua QR labels
7. Tempel ke masing-masing laptop

---

# FAQ & Troubleshooting

## FAQ Umum

**Q: Bagaimana cara reset password?**  
A: Hubungi Super Admin atau IT untuk reset password.

**Q: Kenapa tidak bisa submit permintaan?**  
A: Pastikan semua field yang required sudah diisi dan pilih "Submit untuk Persetujuan" bukan "Simpan sebagai Draft".

**Q: Berapa lama permintaan saya disetujui?**  
A: Tergantung pada Approver. Anda akan mendapat notifikasi saat ada update.

**Q: Bisa tidak karyawan langsung ambil aset tanpa request?**  
A: Tidak. Semua assignment harus melalui workflow request → approval → fulfillment untuk audit trail yang jelas.

**Q: QR code tidak bisa di-scan, kenapa?**  
A: Pastikan QR code tidak rusak/blur. Jika rusak, print ulang dari detail aset. Atau ketik Asset Tag manual.

**Q: Export PDF kok hasilnya HTML?**  
A: Benar, sistem export ke HTML terlebih dahulu. Buka file HTML lalu Print to PDF via browser (Ctrl+P → Save as PDF).

## Troubleshooting

### Tidak Bisa Login

**Masalah:** Error "Invalid credentials"  
**Solusi:**
1. Cek No. Pegawai dan Password (case-sensitive)
2. Pastikan akun belum di-nonaktifkan
3. Reset password via Admin

**Masalah:** Error "Network error"  
**Solusi:**
1. Cek koneksi internet
2. Coba refresh browser (Ctrl+F5)
3. Clear browser cache

### Fitur Tidak Muncul

**Masalah:** Menu tertentu tidak terlihat  
**Solusi:** Cek role Anda. Beberapa menu hanya untuk Admin/Super Admin.

**Masalah:** Tombol disable/abu-abu  
**Solusi:** 
1. Cek status aset (misal: tidak bisa assign jika status bukan "Tersedia")
2. Cek permissions Anda

### Upload Gagal

**Masalah:** File tidak bisa diupload  
**Solusi:**
1. Cek ukuran file (max 10MB)
2. Cek format file (hanya PDF, DOCX, XLSX, JPG, PNG)
3. Cek koneksi internet

### Export Tidak Berfungsi

**Masalah:** Klik Export tapi tidak download  
**Solusi:**
1. Cek browser pop-up blocker
2. Ijinkan download dari situs SIAP
3. Coba browser lain

---

## Kontak Support

Jika mengalami masalah teknis:

**IT Support:**
- Email: it.support@company.com
- Ext: 1234

**Asset Admin:**
- Email: asset.admin@company.com
- Ext: 5678

---

**© 2025 - SIAP: Sistem Informasi Aset Perusahaan**  
**Versi 1.0**
