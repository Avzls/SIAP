'use client';

import { useEffect, useState } from 'react';
import { maintenanceApi, assetsApi } from '@/lib/api'; // salesApi might not exist, using generic way
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RequireRole } from '@/components/auth/RequireRole';
import { 
  Calendar,
  Clock,
  Wrench,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs'>('schedules');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    asset_id: '',
    frequency_days: 30,
    start_date: new Date().toISOString().split('T')[0],
  });

  // Log Maintenance Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    asset_id: '',
    schedule_id: '',
    title: '',
    type: 'PREVENTIVE',
    status: 'COMPLETED',
    completed_at: new Date().toISOString().split('T')[0],
    cost: 0,
    performed_by: '',
    description: '',
  });

  // Data helpers
  const [assets, setAssets] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'schedules') {
        const res = await maintenanceApi.schedules();
        setSchedules(res.data.data.data);
      } else {
        const res = await maintenanceApi.logs();
        setLogs(res.data.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
        // AssetController returns Resource Collection, so it is res.data.data
        const res = await api.get('/assets', { params: { per_page: 100 } }); 
        setAssets(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
      fetchAssets();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceApi.createSchedule({
        title: scheduleForm.title,
        asset_id: scheduleForm.asset_id,
        frequency_days: Number(scheduleForm.frequency_days),
        next_due_at: scheduleForm.start_date
      });
      toast.success('Jadwal berhasil dibuat');
      setShowScheduleModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat jadwal');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if(!confirm('Hapus jadwal ini?')) return;
    try {
        await maintenanceApi.deleteSchedule(id);
        toast.success('Jadwal dihapus');
        fetchData();
    } catch (e) { toast.error('Gagal menghapus'); }
  }

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceApi.createLog({
        ...logForm,
        schedule_id: logForm.schedule_id || null, 
      });
      toast.success('Laporan tersimpan');
      setShowLogModal(false);
      if (activeTab === 'logs') fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    }
  };

  return (
    <RequireRole roles={['asset_admin', 'super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pemeliharaan</h1>
            <p className="text-gray-500">Jadwal service berkala & riwayat perbaikan aset</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowLogModal(true)} variant="outline">
                <Wrench className="w-4 h-4 mr-2" />
                Catat Service
            </Button>
            <Button onClick={() => setShowScheduleModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Jadwal Baru
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'schedules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Jadwal Rutin (Schedules)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Riwayat Service (Logs)
          </button>
        </div>

        {/* Content */}
        {loading ? (
             <div className="flex justify-center py-12">
               <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
             </div>
        ) : activeTab === 'schedules' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map(sch => {
                    const isOverdue = new Date(sch.next_due_at) < new Date();
                    return (
                        <Card key={sch.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{sch.title}</h3>
                                    <button onClick={() => handleDeleteSchedule(sch.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                                <div className="text-sm text-gray-600 mb-4">
                                    {sch.asset?.name} ({sch.asset?.asset_tag})
                                </div>
                                
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Tiap {sch.frequency_days} Hari</span>
                                    </div>
                                    <div className={`flex items-center gap-2 font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                                        <Calendar className="w-4 h-4" />
                                        <span>Jatuh Tempo: {format(new Date(sch.next_due_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Terakhir: {sch.last_performed_at ? format(new Date(sch.last_performed_at), 'dd MMM yyyy') : 'Belum pernah'}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                            setLogForm({
                                                ...logForm,
                                                asset_id: String(sch.asset_id),
                                                schedule_id: String(sch.id),
                                                title: `Service Rutin: ${sch.title}`,
                                                type: 'PREVENTIVE'
                                            });
                                            setShowLogModal(true);
                                        }}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Selesaikan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {schedules.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">Belum ada jadwal maintenance.</p>}
            </div>
        ) : (
             <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Aset</th>
                                <th className="px-6 py-3">Judul/Deskripsi</th>
                                <th className="px-6 py-3">Jenis</th>
                                <th className="px-6 py-3">Biaya</th>
                                <th className="px-6 py-3">Teknisi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{format(new Date(log.completed_at), 'dd/MM/yyyy')}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{log.asset?.name}</div>
                                        <div className="text-xs text-gray-500">{log.asset?.asset_tag}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{log.title}</div>
                                        <div className="text-xs text-gray-500 max-w-xs truncate">{log.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            log.type === 'PREVENTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        Rp {Number(log.cost).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">{log.performed_by || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <div className="text-center py-8 text-gray-500">Belum ada riwayat service.</div>}
                </CardContent>
             </Card>
        )}

        {/* Modal Create Schedule */}
        <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Buat Jadwal Maintenance">
            <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Judul Jadwal</label>
                    <Input required placeholder="Contoh: Ganti Oli Rutin" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} />
                </div>
                <div>
                     <label className="block text-sm font-medium mb-1">Aset</label>
                     <select 
                        className="w-full border rounded-lg p-2"
                        value={scheduleForm.asset_id}
                        onChange={e => setScheduleForm({...scheduleForm, asset_id: e.target.value})}
                        required
                     >
                         <option value="">Pilih Aset...</option>
                         {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>)}
                     </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Frekuensi (Hari)</label>
                        <Input type="number" min="1" required value={scheduleForm.frequency_days} onChange={e => setScheduleForm({...scheduleForm, frequency_days: Number(e.target.value)})} />
                        <p className="text-xs text-gray-500 mt-1">Contoh: 30 untuk Bulanan</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mulai Tanggal</label>
                        <Input type="date" required value={scheduleForm.start_date} onChange={e => setScheduleForm({...scheduleForm, start_date: e.target.value})} />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit">Simpan Jadwal</Button>
                </div>
            </form>
        </Modal>

        {/* Modal Log Maintenance */}
        <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Catat Laporan Service">
            <form onSubmit={handleCreateLog} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Jenis</label>
                        <select 
                            className="w-full border rounded-lg p-2"
                            value={logForm.type} 
                            onChange={e => setLogForm({...logForm, type: e.target.value})}
                        >
                            <option value="PREVENTIVE">Preventive (Pencegahan)</option>
                            <option value="CORRECTIVE">Corrective (Perbaikan)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                        <Input type="date" required value={logForm.completed_at} onChange={e => setLogForm({...logForm, completed_at: e.target.value})} />
                    </div>
                 </div>

                 <div>
                     <label className="block text-sm font-medium mb-1">Aset</label>
                     <select 
                        className="w-full border rounded-lg p-2"
                        value={logForm.asset_id}
                        onChange={e => setLogForm({...logForm, asset_id: e.target.value})}
                        required
                     >
                         <option value="">Pilih Aset...</option>
                         {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>)}
                     </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Judul Pekerjaan</label>
                    <Input required placeholder="Contoh: Ganti Sparepart X" value={logForm.title} onChange={e => setLogForm({...logForm, title: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Deskripsi / Catatan</label>
                    <textarea 
                        className="w-full border rounded-lg p-2 min-h-[80px]" 
                        value={logForm.description} 
                        onChange={e => setLogForm({...logForm, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Biaya (Rp)</label>
                        <Input type="number" min="0" value={logForm.cost} onChange={e => setLogForm({...logForm, cost: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dikerjakan Oleh</label>
                        <Input placeholder="Nama Teknisi / Vendor" value={logForm.performed_by} onChange={e => setLogForm({...logForm, performed_by: e.target.value})} />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit">Simpan Laporan</Button>
                </div>
            </form>
        </Modal>
      </div>
    </RequireRole>
  );
}
