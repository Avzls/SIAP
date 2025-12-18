'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface RequestItem {
  category_id: string;
  quantity: number;
  specifications: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    request_type: 'NEW',
    justification: '',
    items: [{ category_id: '', quantity: 1, specifications: '' }] as RequestItem[],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { category_id: '', quantity: 1, specifications: '' }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent, submitNow = false) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create request
      const { data } = await requestsApi.create({
        request_type: formData.request_type,
        justification: formData.justification,
        items: formData.items.map(item => ({
          category_id: parseInt(item.category_id) || 1,
          quantity: item.quantity,
          specifications: item.specifications,
        })),
      });

      // If submit now, also submit the request
      if (submitNow && data.data?.id) {
        await requestsApi.submit(data.data.id);
      }

      router.push('/requests');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permintaan Baru</h1>
          <p className="text-gray-500">Ajukan permintaan aset atau layanan baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail Permintaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Jenis Permintaan
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'NEW', label: 'Aset Baru' },
                  { value: 'RETURN', label: 'Pengembalian' },
                  { value: 'REPAIR', label: 'Perbaikan' },
                  { value: 'TRANSFER', label: 'Transfer' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, request_type: type.value })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.request_type === type.value
                        ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Alasan / Justifikasi
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jelaskan mengapa Anda membutuhkan aset ini..."
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Item yang Diminta
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Tambah Item
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Item #{index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={item.category_id}
                      onChange={(e) => updateItem(index, 'category_id', e.target.value)}
                      className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="1">Peralatan IT</option>
                      <option value="2">Perangkat Mobile</option>
                      <option value="3">Peralatan Kantor</option>
                      <option value="4">Kendaraan</option>
                      <option value="5">Alat & Perlengkapan</option>
                    </select>

                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Jml"
                    />

                    <Input
                      value={item.specifications}
                      onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                      placeholder="Spesifikasi"
                    />
                  </div>
                </div>
              ))}
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
          <Link href="/requests">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="secondary"
            isLoading={loading}
          >
            Simpan sebagai Draf
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            isLoading={loading}
          >
            Ajukan untuk Persetujuan
          </Button>
        </div>
      </form>
    </div>
  );
}
