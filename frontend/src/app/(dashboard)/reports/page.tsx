'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { RequireRole } from '@/components/auth/RequireRole';
import { Package, ArrowRightLeft, FileText, BarChart3, ChevronRight } from 'lucide-react';

const reports = [
  {
    title: 'Ringkasan Aset',
    description: 'Statistik aset berdasarkan status, kategori, dan lokasi',
    href: '/reports/assets',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    title: 'Riwayat Pergerakan',
    description: 'Log pergerakan aset (assign, return, transfer)',
    href: '/reports/movements',
    icon: ArrowRightLeft,
    color: 'bg-green-500',
  },
  {
    title: 'Laporan Permintaan',
    description: 'Statistik permintaan aset per status dan tipe',
    href: '/reports/requests',
    icon: FileText,
    color: 'bg-purple-500',
  },
];

export default function ReportsPage() {
  return (
    <RequireRole roles={['asset_admin', 'super_admin']}>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-500">Pilih jenis laporan yang ingin dilihat</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${report.color} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {report.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Tentang Laporan</h2>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Ringkasan Aset:</strong> Melihat distribusi aset berdasarkan status (In Stock, Assigned, Maintenance, dll), 
              kategori, dan lokasi. Termasuk total nilai aset.
            </p>
            <p>
              <strong>Riwayat Pergerakan:</strong> Melacak semua aktivitas aset seperti penugasan ke karyawan, 
              pengembalian, dan transfer antar pengguna.
            </p>
            <p>
              <strong>Laporan Permintaan:</strong> Analisis permintaan aset termasuk tren bulanan dan 
              distribusi berdasarkan status persetujuan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </RequireRole>
  );
}
