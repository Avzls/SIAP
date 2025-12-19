'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Package, 
  ArrowLeft, 
  Box, 
  MapPin, 
  Tag, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
} from 'lucide-react';

interface AssetsSummary {
  summary: {
    total_assets: number;
    total_value: number;
    expiring_warranty: number;
  };
  by_status: Record<string, number>;
  by_category: Array<{
    category_id: number;
    category_name: string;
    category_code: string;
    count: number;
  }>;
  by_location: Array<{
    location_id: number;
    location_name: string;
    location_code: string;
    count: number;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  IN_STOCK: { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: Package },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
  DISPOSED: { label: 'Disposed', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  LOST: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function AssetsReportPage() {
  const [data, setData] = useState<AssetsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportsApi.assetsSummary();
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gagal memuat data laporan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ringkasan Aset</h1>
          <p className="text-gray-500">Statistik aset berdasarkan status, kategori, dan lokasi</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Aset</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.total_assets}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Box className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Nilai</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.summary.total_value)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Garansi Segera Habis</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.expiring_warranty}</p>
                <p className="text-xs text-gray-400">dalam 30 hari</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            Distribusi Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data.by_status).map(([status, count]) => {
              const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Box };
              const Icon = config.icon;
              return (
                <div key={status} className={`p-4 rounded-xl ${config.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-400" />
              Per Kategori
            </h2>
            <div className="space-y-3">
              {data.by_category.map((item) => (
                <div key={item.category_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.category_name}</p>
                    <p className="text-xs text-gray-500">{item.category_code}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
              {data.by_category.length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Location */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Per Lokasi
            </h2>
            <div className="space-y-3">
              {data.by_location.map((item) => (
                <div key={item.location_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.location_name}</p>
                    <p className="text-xs text-gray-500">{item.location_code}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
              {data.by_location.length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
