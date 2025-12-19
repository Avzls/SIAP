'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auditApi, masterDataApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequireRole } from '@/components/auth/RequireRole';
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  MapPin, 
  Search,
  ArrowRight,
  MoreVertical,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface StockOpname {
  id: number;
  title: string;
  status: string;
  assigned_location_id?: number;
  start_date: string;
  end_date?: string;
  location?: { name: string; code: string };
  creator: { name: string };
  created_at: string;
}

interface Location {
  id: number;
  name: string;
  code: string;
}

export default function AuditListPage() {
  const [audits, setAudits] = useState<StockOpname[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_location_id: '',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditRes, locRes] = await Promise.all([
        auditApi.list(),
        masterDataApi.locations({ active_only: true })
      ]);
      setAudits(auditRes.data.data.data || []);
      setLocations(locRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Gagal memuat data audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assigned_location_id) {
      toast.error('Pilih lokasi target');
      return;
    }

    setSubmitting(true);
    try {
      await auditApi.create({
        ...formData,
        assigned_location_id: Number(formData.assigned_location_id),
      });
      toast.success('Sesi audit berhasil dibuat');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        assigned_location_id: '',
        start_date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create audit:', error);
      toast.error('Gagal membuat sesi audit');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <RequireRole roles={['asset_admin', 'super_admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Opname (Audit)</h1>
            <p className="text-gray-500">Kelola sesi audit fisik aset</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Sesi Baru
          </Button>
        </div>

        {/* Audit List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             <div className="flex justify-center py-12">
               <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
             </div>
          ) : audits.length > 0 ? (
            audits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">{audit.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[audit.status] || 'bg-gray-100'}`}>
                            {audit.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {audit.location?.name || 'Semua Lokasi'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(audit.start_date), 'dd MMMM yyyy', { locale: id })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            By {audit.creator?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Link href={`/audit/${audit.id}`}>
                      <Button variant="outline">
                        Detail
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada sesi audit</h3>
                <p className="text-gray-500">Buat sesi baru untuk memulai stock opname</p>
             </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="tex-lg font-semibold text-gray-900">Buat Sesi Audit Baru</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kegiatan</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Stock Opname Q4 2024 HQ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Target</label>
                  <select
                    required
                    value={formData.assigned_location_id}
                    onChange={(e) => setFormData({...formData, assigned_location_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Lokasi...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Sistem akan mengambil snapshot semua aset di lokasi ini sebagai target audit.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                  <Input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Catatan tambahan..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" isLoading={submitting}>
                     Buat Sesi
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
