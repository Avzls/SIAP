'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequireRole, useHasRole } from '@/components/auth/RequireRole';
import { 
  FileText, 
  ArrowLeft, 
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
  Package,
  Wrench,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/export-utils';

interface RequestsReport {
  summary: {
    total_requests: number;
    pending_requests: number;
    completed_requests: number;
  };
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  monthly_trend: Record<string, number>;
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  FULFILLED: { label: 'Fulfilled', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const typeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  NEW_ASSET: { label: 'Permintaan Aset Baru', icon: Package },
  REPAIR: { label: 'Permintaan Perbaikan', icon: Wrench },
  RETURN: { label: 'Pengembalian', icon: RotateCcw },
};

export default function RequestsReportPage() {
  const [data, setData] = useState<RequestsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Check if user has access before making API calls
  // Returns null during hydration, then true/false
  const hasAccess = useHasRole(['asset_admin', 'super_admin']);

  const fetchData = async () => {
    // Wait until hasAccess is determined
    if (hasAccess === null) return;
    
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await reportsApi.requests({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess !== null) {
      fetchData();
    }
  }, [hasAccess]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await reportsApi.exportRequests(params, format);
      const extension = format === 'excel' ? 'csv' : 'html';
      const filename = `requests-${new Date().toISOString().split('T')[0]}.${extension}`;
      downloadFile(response.data, filename);
      
      if (format === 'pdf') {
        toast.success('File HTML berhasil didownload. Buka file dan Print to PDF untuk convert.');
      } else {
        toast.success('File Excel (CSV) berhasil didownload');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Gagal export laporan');
    } finally {
      setExporting(false);
    }
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
    <RequireRole roles={['asset_admin', 'super_admin']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Permintaan</h1>
            <p className="text-gray-500">Statistik permintaan aset per status dan tipe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            disabled={exporting || !data}
            isLoading={exporting}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting || !data}
            isLoading={exporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Permintaan</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.total_requests}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{data.summary.pending_requests}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Selesai</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{data.summary.completed_requests}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Per Status
            </h2>
            <div className="space-y-3">
              {Object.entries(data.by_status).map(([status, count]) => {
                const config = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: FileText };
                const Icon = config.icon;
                return (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{config.label}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
              {Object.keys(data.by_status).length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              Per Tipe Permintaan
            </h2>
            <div className="space-y-3">
              {Object.entries(data.by_type).map(([type, count]) => {
                const config = typeLabels[type] || { label: type, icon: FileText };
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{config.label}</span>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {count}
                    </span>
                  </div>
                );
              })}
              {Object.keys(data.by_type).length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Tren 6 Bulan Terakhir
          </h2>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(data.monthly_trend).map(([month, count]) => (
              <div key={month} className="text-center">
                <div 
                  className="bg-blue-100 rounded-lg mx-auto mb-2" 
                  style={{ 
                    height: `${Math.max(20, (count / Math.max(...Object.values(data.monthly_trend), 1)) * 100)}px`,
                    width: '100%',
                  }}
                />
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{month}</p>
              </div>
            ))}
            {Object.keys(data.monthly_trend).length === 0 && (
              <p className="text-gray-500 text-center py-4 col-span-6">Tidak ada data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </RequireRole>
  );
}
