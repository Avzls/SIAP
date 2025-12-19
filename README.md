# SIAP - Sistem Informasi Aset Perusahaan

SIAP adalah aplikasi Manajemen Aset (Asset Management System) internal yang dirancang untuk mengelola inventaris perusahaan secara efisien, mulai dari pengadaan, assignment, tracking, maintenance, hingga disposal aset. Sistem ini dibangun dengan teknologi modern dan dilengkapi dengan fitur-fitur lengkap untuk manajemen aset end-to-end.

## 🚀 Fitur Utama

### Core Features
- **Dashboard Real-time**: Ringkasan status aset, nilai total, dan aktivitas terbaru
- **Manajemen Aset Lengkap**: 
  - CRUD aset dengan kategori, lokasi, dan QR code labels
  - Asset assignment, return, dan transfer antar user/lokasi
  - Asset disposal (retire) dan lost/found tracking
  - Asset movement history (audit trail)
  - Asset depreciation calculation dengan grafik
  - Multiple attachments per asset (dokumen, foto)
  - Bulk import via CSV

### Request & Approval Flow
- **Self-Service Request**: Karyawan dapat mengajukan permintaan aset baru, perbaikan, atau pengembalian
- **Workflow Approval**: Alur persetujuan bertingkat dari Approver hingga Admin Aset
- **Fulfillment System**: Admin dapat memenuhi request yang sudah disetujui

### Advanced Features
- **Stock Opname/Audit**: Scan QR code untuk verifikasi fisik aset di lokasi tertentu
- **Maintenance Management**: Schedule & log pemeliharaan berkala untuk aset
- **Comprehensive Reporting**: 
  - Laporan ringkasan aset (summary, by category, by location)
  - Laporan pergerakan aset dengan filtering
  - Laporan permintaan aset
  - **Export to Excel (CSV) dan PDF** untuk semua laporan
- **In-App Notifications**: Notifikasi real-time untuk approval, assignment, dll
- **Role-Based Access Control (RBAC)**: 62 granular permissions untuk 4 role types

### Security & Administration
- **Authentication**: Laravel Sanctum dengan token-based authentication
- **Permission System**: 62 permissions across 13 modules
- **Role Management**: Dynamic role creation dan permission assignment
- **User Management**: CRUD users dengan role assignment

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12
- **Database**: MySQL
- **Authentication**: Laravel Sanctum (Token-based)
- **Permission**: Spatie Laravel-Permission
- **Export**: Native CSV + HTML to PDF

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components + Recharts for charts
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

---

## ⚙️ Installation

### Prerequisites
- PHP 8.2+
- Node.js 20+
- Composer
- MySQL Server
- Laragon / XAMPP (optional)

### 1. Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd SIAP

# Install dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Update .env with your database credentials
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=siap
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seeders
php artisan migrate --seed

# Start development server
php artisan serve
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local

# Run development server
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api

---

## 🔐 Default User Accounts

After running seeders, use these credentials to login (default password: `password`):

| Employee ID | Name | Role | Permissions |
|-------------|------|------|-------------|
| **SA001** | Super Admin | super_admin | Full system access (all 62 permissions) |
| **AA001** | Asset Admin | asset_admin | Asset management, fulfillment, reports (58 permissions) |
| **AP001** | Approver | approver | Approve/reject requests (16 permissions) |
| **EM001** | Employee | employee | View assets, create requests (13 permissions) |

---

## 📋 Permission System

The system implements granular RBAC with **62 permissions** across **13 modules**:

### Modules
1. **Dashboard** (1 permission)
2. **Assets** (17 permissions) - Full CRUD, assignment, disposal, attachments, import
3. **Requests** (7 permissions) - Create, update, submit, cancel
4. **Approvals** (3 permissions) - View, approve, reject
5. **Fulfillment** (4 permissions) - Fulfill various request types
6. **Stock Opname/Audit** (5 permissions) - Create, scan, finalize audits
7. **Maintenance** (5 permissions) - Schedules and logs
8. **Reports** (3 permissions) - Assets, movements, requests reports
9. **Categories** (4 permissions) - Master data CRUD
10. **Locations** (4 permissions) - Master data CRUD
11. **Users** (3 permissions) - View, update, assign roles
12. **Roles** (5 permissions) - Full CRUD and permission management
13. **Notifications** (3 permissions) - View, mark read, delete

For detailed permission documentation, see `database/seeders/PermissionSeeder.php`.

---

## 📊 Export Reports Feature

All reports can be exported in two formats:
- **Excel (CSV)**: Compatible with Excel, LibreOffice, Google Sheets
- **PDF (HTML)**: Download HTML file → Print to PDF via browser (Ctrl+P)

Available exports:
- Assets Summary Report (with category, location, status filters)
- Movements Report (with date range and type filters)
- Requests Report (with date range and status filters)

---

## 📂 Project Structure

```
SIAP/
├── app/
│   ├── Http/Controllers/Api/    # API Controllers
│   ├── Models/                   # Eloquent Models
│   ├── Enums/                    # Status & Type Enums
│   └── Resources/                # API Resources
├── database/
│   ├── migrations/               # Database migrations
│   └── seeders/                  # Seeders (Permissions, Roles, Demo Data)
├── routes/
│   └── api.php                   # API Routes
├── resources/
│   └── views/exports/            # PDF export templates (Blade)
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js pages (App Router)
│   │   ├── components/           # React components
│   │   │   ├── ui/               # UI components
│   │   │   └── auth/             # Auth components (RequireRole)
│   │   ├── lib/                  # Utilities
│   │   │   ├── api.ts            # API client
│   │   │   ├── auth.ts           # Auth store (Zustand)
│   │   │   ├── utils.ts          # Helper functions
│   │   │   └── export-utils.ts   # Export utility functions
│   │   └── types/                # TypeScript types
│   └── public/                   # Static assets
```

---

## 🔄 Common Commands

### Backend
```bash
# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Fresh migration with seed
php artisan migrate:fresh --seed

# Clear cache
php artisan cache:clear
php artisan route:clear
php artisan config:clear

# Generate QR codes (if needed)
php artisan qr:generate
```

### Frontend
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

---

## 🚧 Upcoming Features

- [ ] Email notifications (approval, assignment, warranty expiry)
- [ ] Activity logs/audit trail
- [ ] Batch operations (bulk transfer, update, retire)
- [ ] Advanced search with saved filters
- [ ] Asset photos gallery
- [ ] Warranty alerts dashboard
- [ ] Mobile barcode scanner
- [ ] Asset reservation system

---

## 📝 Development Notes

### Adding New Permissions
1. Add permissions to `database/seeders/PermissionSeeder.php`
2. Assign to roles in `database/seeders/RoleSeeder.php`
3. Run: `php artisan db:seed --class=PermissionSeeder` then `php artisan db:seed --class=RoleSeeder`
4. Clear permission cache: `php artisan permission:cache-reset`

### Frontend Permission Check
```typescript
import { useAuthStore } from '@/lib/auth';

// In component
const { user } = useAuthStore();
const isAdmin = user?.roles?.some(r => ['asset_admin', 'super_admin'].includes(r));

// Or use RequireRole component
<RequireRole roles={['asset_admin', 'super_admin']}>
  <AdminOnlyContent />
</RequireRole>
```

---

## 🐛 Troubleshooting

**Error: Class "Spatie\Permission\Models\Role" not found**
```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

**Frontend can't connect to API**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify Laravel server is running on correct port
- Check CORS settings in Laravel

**Export not working**
- Verify user has correct role (asset_admin or super_admin)
- Check browser console for errors
- Ensure routes are registered: `php artisan route:list --name=export`

---

## 📄 License

This system is developed internally for company asset management purposes.

---

## 👨‍💻 Development Team

Developed with ❤️ for efficient asset management.
