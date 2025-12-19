'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { assetsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

interface AssetFormData {
  asset_tag: string;
  name: string;
  category_id: string;
  location_id: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: string;
  useful_life_years: string;
  residual_value: string;
  warranty_end: string;
  notes: string;
}

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<AssetFormData>({
    asset_tag: '',
    name: '',
    category_id: '',
    location_id: '',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_date: '',
    purchase_price: '',
    useful_life_years: '',
    residual_value: '',
    warranty_end: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        asset_tag: formData.asset_tag,
        name: formData.name,
        category_id: parseInt(formData.category_id) || undefined,
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serial_number: formData.serial_number || undefined,
        purchase_date: formData.purchase_date || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        useful_life_years: formData.useful_life_years ? parseInt(formData.useful_life_years) : undefined,
        residual_value: formData.residual_value ? parseFloat(formData.residual_value) : undefined,
        warranty_end: formData.warranty_end || undefined,
        notes: formData.notes || undefined,
      };

      await assetsApi.create(payload);
      router.push('/assets');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Gagal menambah aset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Aset Baru</h1>
          <p className="text-gray-500">Daftarkan aset baru ke dalam sistem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Aset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tag Aset <span className="text-red-500">*</span>
                </label>
                <Input
                  name="asset_tag"
                  value={formData.asset_tag}
                  onChange={handleChange}
                  placeholder="AST-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Aset <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Laptop Dell Latitude"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  <option value="1">Peralatan IT</option>
                  <option value="2">Perangkat Mobile</option>
                  <option value="3">Peralatan Kantor</option>
                  <option value="4">Kendaraan</option>
                  <option value="5">Alat & Perlengkapan</option>
                  <option value="6">Peralatan Jaringan</option>
                  <option value="7">Audio Visual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lokasi
                </label>
                <select
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Lokasi</option>
                  <option value="1">Kantor Pusat - Lantai 1</option>
                  <option value="2">Kantor Pusat - Lantai 2</option>
                  <option value="3">Kantor Pusat - Lantai 3</option>
                  <option value="4">Gudang A</option>
                  <option value="5">Gudang B</option>
                  <option value="6">Ruang Server IT</option>
                  <option value="7">Penyimpanan Aset</option>
                </select>
              </div>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Merek</label>
                <Input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Dell, HP, Lenovo..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <Input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Latitude 5520"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nomor Seri</label>
                <Input
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="SN12345678"
                />
              </div>
            </div>

            {/* Purchase Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tanggal Pembelian</label>
                <Input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Harga Pembelian</label>
                <Input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="15000000"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Umur Ekonomis (Tahun)</label>
                <Input
                  type="number"
                  name="useful_life_years"
                  value={formData.useful_life_years}
                  onChange={handleChange}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nilai Sisa (Residu)</label>
                <Input
                  type="number"
                  name="residual_value"
                  value={formData.residual_value}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Garansi Berakhir</label>
                <Input
                  type="date"
                  name="warranty_end"
                  value={formData.warranty_end}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan tambahan tentang aset..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/assets">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button type="submit" isLoading={loading}>
            Simpan Aset
          </Button>
        </div>
      </form>
    </div>
  );
}
