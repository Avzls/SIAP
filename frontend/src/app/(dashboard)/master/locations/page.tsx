'use client';

import { useEffect, useState } from 'react';
import { masterDataApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Plus, Edit, Trash2, X, Check, Search } from 'lucide-react';

interface Location {
  id: number;
  code: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  address?: string;
  is_active: boolean;
  assets_count: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    building: '',
    floor: '',
    room: '',
    address: '',
    is_active: true,
  });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await masterDataApi.locations({ search: search || undefined });
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocations();
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setFormData({ code: '', name: '', building: '', floor: '', room: '', address: '', is_active: true });
    setShowModal(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      code: location.code,
      name: location.name,
      building: location.building || '',
      floor: location.floor || '',
      room: location.room || '',
      address: location.address || '',
      is_active: location.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLocation) {
        await masterDataApi.updateLocation(editingLocation.id, formData);
      } else {
        await masterDataApi.createLocation(formData);
      }
      setShowModal(false);
      fetchLocations();
    } catch (error) {
      console.error('Failed to save location:', error);
      alert('Gagal menyimpan lokasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (location.assets_count > 0) {
      alert(`Lokasi tidak dapat dihapus karena masih memiliki ${location.assets_count} aset`);
      return;
    }
    if (!confirm(`Hapus lokasi "${location.name}"?`)) return;
    try {
      await masterDataApi.deleteLocation(location.id);
      fetchLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Gagal menghapus lokasi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lokasi Aset</h1>
          <p className="text-gray-500">Kelola lokasi penyimpanan aset</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Lokasi
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Cari</Button>
          </form>
        </CardContent>
      </Card>

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
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kode</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gedung</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lantai</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ruangan</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aset</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{location.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{location.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{location.building || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{location.floor || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{location.room || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          location.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {location.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{location.assets_count}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(location)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(location)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {locations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>Belum ada lokasi</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: HQ-01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kantor Pusat"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gedung</label>
                <Input
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Contoh: Gedung A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lantai</label>
                  <Input
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="Contoh: 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Contoh: R.301"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap (opsional)"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Lokasi Aktif</span>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={saving}>
                  <Check className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
