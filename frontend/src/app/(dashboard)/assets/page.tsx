'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { assetsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Search, Filter, Eye, Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle, Printer, CheckSquare, Square } from 'lucide-react';
import type { Asset } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

export default function AssetsPage() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAdmin = user?.roles?.some(r => ['asset_admin', 'super_admin'].includes(r));

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    success_count?: number;
    skip_count?: number;
    errors?: { row: number; message: string }[];
  } | null>(null);
  const [formatInfo, setFormatInfo] = useState<{ column: string; description: string; required: boolean }[]>([]);

  const fetchAssets = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await assetsApi.list({
        page,
        per_page: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setAssets(data.data || []);
      setMeta(data.meta || { total: 0, current_page: 1, last_page: 1 });
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets();
  };

  // Import handlers
  const openImportModal = async () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportResult(null);
    // Fetch format info
    try {
      const { data } = await assetsApi.importFormat();
      setFormatInfo(data.columns || []);
    } catch (err) {
      console.error('Failed to fetch format:', err);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const { data } = await assetsApi.import(formData);
      setImportResult(data);
      if (data.success) {
        toast.success(data.message);
        fetchAssets();
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Gagal mengimport file';
      setImportResult({ success: false, message });
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/assets/import/template`, '_blank');
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Popup blocker aktif. Izinkan popup untuk mencetak label.');
      return;
    }

    // Get selected assets details
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Label QR</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: sans-serif; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .card { 
              border: 1px dashed #ccc; 
              padding: 20px; 
              border-radius: 8px; 
              display: flex; 
              align-items: center; 
              gap: 20px;
              page-break-inside: avoid;
            }
            .qr-code { width: 100px; height: 100px; }
            .info { flex: 1; }
            .company { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
            .tag { font-size: 24px; font-weight: bold; margin: 0; font-family: monospace; }
            .name { font-size: 16px; margin: 5px 0 0 0; }
            .meta { font-size: 11px; color: #666; margin-top: 5px; }
            @media print {
              .no-print { display: none; }
              .card { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Cetak Sekarang</button>
          </div>
          <div class="grid">
            ${selectedAssets.map(asset => `
              <div class="card">
                <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(asset.asset_tag)}" />
                <div class="info">
                  <div class="company">PT. Sinergi Aset</div>
                  <h1 class="tag">${asset.asset_tag}</h1>
                  <h2 class="name">${asset.name}</h2>
                  <div class="meta">
                    Lokasi: ${asset.current_location?.name || '-'}<br>
                    Tgl Beli: ${asset.purchase_date || '-'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aset</h1>
          <p className="text-gray-500">Kelola dan lacak semua aset perusahaan</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={openImportModal}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Link href="/assets/new">
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Aset
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900 font-medium">{selectedIds.length} akaun dipilih</span>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">
               Batal
             </Button>
             <Button size="sm" onClick={handleBulkPrint}>
               <Printer className="h-4 w-4 mr-2" />
               Cetak Label ({selectedIds.length})
             </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan nama, tag, atau nomor seri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="IN_STOCK">Tersedia</option>
                <option value="ASSIGNED">Digunakan</option>
                <option value="IN_REPAIR">Perbaikan</option>
                <option value="RETIRED">Tidak Aktif</option>
                <option value="LOST">Hilang</option>
              </select>
              <Button variant="outline" onClick={() => fetchAssets()}>
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Aset</p>
          <p className="text-2xl font-bold text-gray-900">{meta.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-sm text-green-600">Tersedia</p>
          <p className="text-2xl font-bold text-green-700">
            {assets.filter(a => a.status.value === 'IN_STOCK').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-blue-600">Digunakan</p>
          <p className="text-2xl font-bold text-blue-700">
            {assets.filter(a => a.status.value === 'ASSIGNED').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
          <p className="text-sm text-yellow-600">Perbaikan</p>
          <p className="text-2xl font-bold text-yellow-700">
            {assets.filter(a => a.status.value === 'IN_REPAIR').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 w-4">
                      <button 
                        onClick={toggleSelectAll}
                        className="text-gray-400 hover:text-gray-600"
                      >
                         {selectedIds.length === assets.length && assets.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                         ) : (
                            <Square className="w-5 h-5" />
                         )}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aset
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pemegang
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(asset.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSelection(asset.id)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                           {selectedIds.includes(asset.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                           ) : (
                              <Square className="w-5 h-5" />
                           )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {asset.category?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(asset.status.color)}>
                          {asset.status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {asset.current_user?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {asset.current_location?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {asset.purchase_price
                            ? formatCurrency(parseFloat(asset.purchase_price))
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/assets/${asset.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada aset ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={meta.current_page === 1}
            onClick={() => fetchAssets(meta.current_page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Halaman {meta.current_page} dari {meta.last_page}
          </span>
          <Button
            variant="outline"
            disabled={meta.current_page === meta.last_page}
            onClick={() => fetchAssets(meta.current_page + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Import Aset dari CSV</h2>
                  <p className="text-sm text-gray-500">Upload file CSV untuk menambahkan banyak aset sekaligus</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Template Download */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Download Template</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Download template CSV untuk memastikan format yang benar.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Format Description */}
            {formatInfo.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Format Kolom:</p>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Kolom</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Deskripsi</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Wajib</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formatInfo.map((col) => (
                        <tr key={col.column}>
                          <td className="px-3 py-2 font-mono text-xs">{col.column}</td>
                          <td className="px-3 py-2 text-gray-600">{col.description}</td>
                          <td className="px-3 py-2 text-center">
                            {col.required ? (
                              <span className="text-red-600 font-bold">*</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="mb-6">
              <label className="block mb-2">
                <span className="text-sm font-medium text-gray-700">File CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
              </label>
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">
                  File dipilih: <span className="font-medium">{importFile.name}</span> ({Math.round(importFile.size / 1024)} KB)
                </p>
              )}
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`mb-6 p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {importResult.message}
                    </p>
                    {importResult.success_count !== undefined && (
                      <p className="text-sm text-green-700 mt-1">
                        ✓ {importResult.success_count} aset berhasil diimport
                        {importResult.skip_count ? `, ${importResult.skip_count} dilewati` : ''}
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-red-700">
                            Baris {err.row}: {err.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowImportModal(false)}>
                {importResult?.success ? 'Tutup' : 'Batal'}
              </Button>
              {!importResult?.success && (
                <Button 
                  onClick={handleImport} 
                  disabled={!importFile || importing}
                  isLoading={importing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
